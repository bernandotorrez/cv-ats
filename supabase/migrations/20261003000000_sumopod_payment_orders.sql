-- =====================================================
-- SumoPod Payment Gateway — orders, webhook log, fulfillment
-- Created: 2026-10-03
--
-- Flow:
-- 1. Edge Function `payment-create` (user JWT) menghitung harga di server,
--    membuat row `payment_orders` (pending) lalu membuat payment link SumoPod.
-- 2. SumoPod memanggil `payment-webhook` (signature svix diverifikasi).
-- 3. Webhook memanggil `fulfill_payment_order()` — atomik & idempotent
--    (row di-lock FOR UPDATE, aktivasi hanya sekali).
--
-- Security: user hanya bisa SELECT order miliknya. Insert/update hanya via
-- service_role (edge functions). Fungsi fulfillment hanya untuk service_role.
-- =====================================================

CREATE TABLE IF NOT EXISTS public.payment_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_type TEXT NOT NULL
    CHECK (product_type IN ('tier', 'addon_upload_cv', 'addon_pro_photo', 'tryout')),
  product_ref TEXT NOT NULL,          -- tier slug / tryout package slug / addon key
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity BETWEEN 1 AND 20),
  amount_idr INTEGER NOT NULL CHECK (amount_idr > 0),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'failed', 'expired', 'cancelled')),
  gateway TEXT NOT NULL DEFAULT 'sumopod',
  gateway_payment_id TEXT UNIQUE,
  payment_link_url TEXT,
  payment_method TEXT,
  fee_idr INTEGER,
  net_amount_idr INTEGER,
  expires_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  fulfilled_at TIMESTAMPTZ,
  fulfillment_result JSONB,
  last_event TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_orders_user_created
  ON public.payment_orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_orders_pending
  ON public.payment_orders(user_id, product_type, product_ref)
  WHERE status = 'pending';

ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own payment orders" ON public.payment_orders;
CREATE POLICY "Users can view own payment orders" ON public.payment_orders
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all payment orders" ON public.payment_orders;
CREATE POLICY "Admins can view all payment orders" ON public.payment_orders
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_payment_orders_updated_at ON public.payment_orders;
CREATE TRIGGER update_payment_orders_updated_at
  BEFORE UPDATE ON public.payment_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ─── Webhook log (audit + dedupe by svix-id) ─────────────────────────
CREATE TABLE IF NOT EXISTS public.payment_webhook_events (
  svix_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  order_id TEXT,
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ,
  error TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_webhook_events_order
  ON public.payment_webhook_events(order_id);

-- RLS on, no policies: hanya service_role yang bisa akses.
ALTER TABLE public.payment_webhook_events ENABLE ROW LEVEL SECURITY;

-- ─── Kuota Foto Pro hasil pembelian (tidak ikut reset bulanan tier) ──
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS quota_pro_photo_purchased INTEGER NOT NULL DEFAULT 0
  CHECK (quota_pro_photo_purchased >= 0);

COMMENT ON COLUMN public.profiles.quota_pro_photo_purchased IS
  'Kuota Foto Pro yang dibeli (add-on). Tidak di-reset bulanan; dipakai setelah kuota tier (quota_pro_photo) habis.';

-- Lindungi kolom baru dari update oleh user biasa (sama seperti kolom kuota lain)
CREATE OR REPLACE FUNCTION public.protect_profile_quotas()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NEW.quota_upload_cv IS DISTINCT FROM OLD.quota_upload_cv OR
     NEW.quota_pro_photo IS DISTINCT FROM OLD.quota_pro_photo OR
     NEW.quota_pro_photo_purchased IS DISTINCT FROM OLD.quota_pro_photo_purchased OR
     NEW.quota_upload_cv_reset_at IS DISTINCT FROM OLD.quota_upload_cv_reset_at OR
     NEW.quota_pro_photo_reset_at IS DISTINCT FROM OLD.quota_pro_photo_reset_at OR
     NEW.has_upload_cv IS DISTINCT FROM OLD.has_upload_cv OR
     NEW.has_pro_photo IS DISTINCT FROM OLD.has_pro_photo OR
     NEW.upload_cv_end_date IS DISTINCT FROM OLD.upload_cv_end_date OR
     NEW.pro_photo_end_date IS DISTINCT FROM OLD.pro_photo_end_date
  THEN
    RAISE EXCEPTION 'Not authorized to modify quota or subscription fields';
  END IF;

  RETURN NEW;
END;
$$;

-- ─── Fulfillment (atomic + idempotent) ───────────────────────────────
CREATE OR REPLACE FUNCTION public.fulfill_payment_order(
  p_order_id TEXT,
  p_gateway_payment_id TEXT,
  p_amount INTEGER,
  p_payment_method TEXT DEFAULT NULL,
  p_paid_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.payment_orders%ROWTYPE;
  v_now TIMESTAMPTZ := now();
  v_result JSONB;
  v_tier_id UUID;
  v_sub RECORD;
  v_base TIMESTAMPTZ;
  v_end TIMESTAMPTZ;
  v_pkg RECORD;
  v_credit_id UUID;
  v_profile RECORD;
BEGIN
  SELECT * INTO v_order
  FROM public.payment_orders
  WHERE order_id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'order_not_found';
  END IF;

  -- Idempotent: sudah diaktifkan sebelumnya
  IF v_order.fulfilled_at IS NOT NULL THEN
    RETURN jsonb_build_object('already_fulfilled', true, 'result', v_order.fulfillment_result);
  END IF;

  -- Validasi data dari gateway terhadap data order di server
  IF p_amount IS DISTINCT FROM v_order.amount_idr THEN
    RAISE EXCEPTION 'amount_mismatch: expected %, got %', v_order.amount_idr, p_amount;
  END IF;

  IF v_order.gateway_payment_id IS NOT NULL
     AND p_gateway_payment_id IS DISTINCT FROM v_order.gateway_payment_id THEN
    RAISE EXCEPTION 'payment_id_mismatch';
  END IF;

  IF v_order.product_type = 'tier' THEN
    SELECT id INTO v_tier_id
    FROM public.subscription_tiers
    WHERE slug = v_order.product_ref;
    IF v_tier_id IS NULL THEN
      RAISE EXCEPTION 'tier_not_found: %', v_order.product_ref;
    END IF;

    SELECT id, tier_id, date_end INTO v_sub
    FROM public.user_subscriptions
    WHERE user_id = v_order.user_id AND status = 'active'
    ORDER BY date_end DESC NULLS LAST, created_at DESC
    LIMIT 1
    FOR UPDATE;

    -- Perpanjang dari sisa masa aktif jika tier sama, selain itu mulai dari sekarang
    IF v_sub.id IS NOT NULL AND v_sub.tier_id = v_tier_id
       AND v_sub.date_end IS NOT NULL AND v_sub.date_end > v_now THEN
      v_base := v_sub.date_end;
    ELSE
      v_base := v_now;
    END IF;
    v_end := v_base + make_interval(days => 30 * v_order.quantity);

    IF v_sub.id IS NOT NULL THEN
      UPDATE public.user_subscriptions
      SET tier_id = v_tier_id,
          status = 'active',
          date_start = CASE WHEN v_base = v_now THEN v_now ELSE date_start END,
          date_end = v_end,
          provider = 'sumopod',
          external_id = v_order.order_id
      WHERE id = v_sub.id;
    ELSE
      INSERT INTO public.user_subscriptions
        (user_id, tier_id, status, date_start, date_end, provider, external_id)
      VALUES
        (v_order.user_id, v_tier_id, 'active', v_now, v_end, 'sumopod', v_order.order_id);
    END IF;

    v_result := jsonb_build_object('tier', v_order.product_ref, 'date_end', v_end);

  ELSIF v_order.product_type = 'addon_upload_cv' THEN
    UPDATE public.profiles
    SET has_upload_cv = true,
        upload_cv_end_date =
          GREATEST(COALESCE(upload_cv_end_date, v_now), v_now)
          + make_interval(months => v_order.quantity)
    WHERE id = v_order.user_id
    RETURNING upload_cv_end_date INTO v_profile;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'profile_not_found';
    END IF;

    v_result := jsonb_build_object('upload_cv_end_date', v_profile.upload_cv_end_date);

  ELSIF v_order.product_type = 'addon_pro_photo' THEN
    UPDATE public.profiles
    SET quota_pro_photo_purchased = quota_pro_photo_purchased + v_order.quantity
    WHERE id = v_order.user_id
    RETURNING quota_pro_photo_purchased INTO v_profile;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'profile_not_found';
    END IF;

    v_result := jsonb_build_object('quota_pro_photo_purchased', v_profile.quota_pro_photo_purchased);

  ELSIF v_order.product_type = 'tryout' THEN
    SELECT id, credits INTO v_pkg
    FROM public.tryout_packages
    WHERE slug = v_order.product_ref;
    IF v_pkg.id IS NULL THEN
      RAISE EXCEPTION 'tryout_package_not_found: %', v_order.product_ref;
    END IF;

    INSERT INTO public.tryout_credits
      (user_id, package_id, total_credits, used_credits, payment_method, payment_ref, status, activated_at)
    VALUES
      (v_order.user_id, v_pkg.id, v_pkg.credits * v_order.quantity, 0, 'sumopod', v_order.order_id, 'active', v_now)
    RETURNING id INTO v_credit_id;

    v_result := jsonb_build_object(
      'tryout_credit_id', v_credit_id,
      'credits', v_pkg.credits * v_order.quantity
    );

  ELSE
    RAISE EXCEPTION 'unknown_product_type: %', v_order.product_type;
  END IF;

  UPDATE public.payment_orders
  SET status = 'paid',
      gateway_payment_id = COALESCE(gateway_payment_id, p_gateway_payment_id),
      payment_method = COALESCE(p_payment_method, payment_method),
      paid_at = COALESCE(p_paid_at, v_now),
      fulfilled_at = v_now,
      fulfillment_result = v_result,
      last_event = 'payment.completed'
  WHERE id = v_order.id;

  RETURN jsonb_build_object('already_fulfilled', false, 'result', v_result);
END;
$$;

REVOKE ALL ON FUNCTION public.fulfill_payment_order(TEXT, TEXT, INTEGER, TEXT, TIMESTAMPTZ)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fulfill_payment_order(TEXT, TEXT, INTEGER, TEXT, TIMESTAMPTZ)
  TO service_role;

COMMENT ON TABLE public.payment_orders IS 'Order pembayaran SumoPod. Harga dihitung di server (payment-create).';
COMMENT ON FUNCTION public.fulfill_payment_order IS 'Aktivasi produk setelah webhook payment.completed. Atomic & idempotent. service_role only.';
