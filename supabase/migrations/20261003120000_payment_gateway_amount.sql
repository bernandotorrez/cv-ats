-- =====================================================
-- SumoPod: biaya transaksi ditanggung pembeli
-- Created: 2026-10-03
--
-- Respons SumoPod: amount = harga + fee, net_amount = harga.
-- Simpan jumlah yang benar-benar ditagih (gateway_amount_idr) dan
-- terima jumlah tersebut saat webhook payment.completed.
-- =====================================================

ALTER TABLE public.payment_orders
  ADD COLUMN IF NOT EXISTS gateway_amount_idr INTEGER;

COMMENT ON COLUMN public.payment_orders.gateway_amount_idr IS
  'Jumlah yang ditagih ke pembeli oleh gateway (harga + fee jika fee ditanggung pembeli).';

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
  -- amount dari gateway bisa = harga (fee ditanggung merchant)
  -- atau = harga + fee (fee ditanggung pembeli, disimpan di gateway_amount_idr)
  IF p_amount IS DISTINCT FROM v_order.amount_idr
     AND p_amount IS DISTINCT FROM v_order.gateway_amount_idr THEN
    RAISE EXCEPTION 'amount_mismatch: expected % or %, got %',
      v_order.amount_idr, v_order.gateway_amount_idr, p_amount;
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
