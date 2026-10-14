-- ═════════════════════════════════════════════════════════════════════════════
-- Pembayaran: aturan upgrade/downgrade tier, kuota tier, fee, status kedaluwarsa
-- ═════════════════════════════════════════════════════════════════════════════
-- 1. Upgrade (mis. Starter → Pro) saat paket lama masih aktif: sisa hari paket
--    lama tidak lagi hangus, dikonversi ke hari paket baru sesuai rasio harga
--    (sisa_hari × harga_lama / harga_baru).
--    Downgrade (Pro aktif, bayar Starter) ditolak di payment-create. Bila tetap
--    terbayar (mis. upgrade terjadi di antara buat order & bayar), paket yang
--    lebih tinggi dipertahankan dan nilai pembayaran dikonversi jadi perpanjangan
--    (30 hari × harga_baru / harga_lama).
-- 2. Saat tier berbayar baru aktif (dari Free / upgrade), kuota bulanan tier
--    (Foto Pro, Upload CV) langsung diisi — sebelumnya baru terisi bulan depan
--    bila reset bulanan sudah terjadi bulan ini. Nilai sama dengan
--    TIER_PHOTO_QUOTA (pro-photo) dan TIER_UPLOAD_CV_QUOTA (ai-parse-cv).
-- 3. fee_idr / net_amount_idr hanya diubah bila pembeli membayar di atas harga
--    (fee ditanggung pembeli); bila fee ditanggung merchant, nilai dari gateway
--    dipertahankan.
-- 4. Order pending baru dianggap kedaluwarsa setelah link + 7 hari masa QR
--    (sama dengan src/lib/payment.ts), bukan saat link 24 jam habis.


-- ─── Status tampilan order ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.payment_order_display_status(p_status TEXT, p_expires_at TIMESTAMPTZ)
RETURNS TEXT
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN p_status = 'pending' AND p_expires_at IS NOT NULL
         AND p_expires_at + interval '7 days' <= now()
      THEN 'expired'
    ELSE p_status
  END;
$$;


-- ─── Fulfillment ─────────────────────────────────────────────────────
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
  v_tier RECORD;
  v_sub RECORD;
  v_paid INTERVAL;
  v_bonus INTERVAL := interval '0';
  v_end TIMESTAMPTZ;
  v_final_tier_id UUID;
  v_final_slug TEXT;
  v_mode TEXT;
  v_photo_quota INTEGER;
  v_upload_quota INTEGER;
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

  -- amount dari gateway = harga (fee ditanggung merchant) atau harga + fee
  -- (fee ditanggung pembeli, bisa berbeda dari saat order dibuat).
  -- Yang wajib: pembeli membayar minimal harga produk.
  IF p_amount IS NULL OR p_amount < v_order.amount_idr THEN
    RAISE EXCEPTION 'amount_mismatch: expected >= %, got %', v_order.amount_idr, p_amount;
  END IF;

  IF v_order.gateway_payment_id IS NOT NULL
     AND p_gateway_payment_id IS NOT NULL
     AND p_gateway_payment_id <> v_order.gateway_payment_id THEN
    RAISE EXCEPTION 'payment_id_mismatch';
  END IF;

  IF v_order.product_type = 'tier' THEN
    SELECT id, slug, price_monthly INTO v_tier
    FROM public.subscription_tiers
    WHERE slug = v_order.product_ref;
    IF v_tier.id IS NULL THEN
      RAISE EXCEPTION 'tier_not_found: %', v_order.product_ref;
    END IF;

    SELECT us.id, us.tier_id, us.date_end, us.date_start, st.slug, st.price_monthly
    INTO v_sub
    FROM public.user_subscriptions us
    JOIN public.subscription_tiers st ON st.id = us.tier_id
    WHERE us.user_id = v_order.user_id AND us.status = 'active'
    ORDER BY us.date_end DESC NULLS LAST, us.created_at DESC
    LIMIT 1
    FOR UPDATE OF us;

    v_paid := make_interval(days => 30 * v_order.quantity);

    IF v_sub.id IS NOT NULL AND v_sub.tier_id = v_tier.id
       AND v_sub.date_end IS NOT NULL AND v_sub.date_end > v_now THEN
      -- Perpanjang tier yang sama dari sisa masa aktif
      v_mode := 'extend';
      v_final_tier_id := v_tier.id;
      v_final_slug := v_tier.slug;
      v_end := v_sub.date_end + v_paid;

    ELSIF v_sub.id IS NOT NULL AND COALESCE(v_sub.price_monthly, 0) > 0
          AND v_sub.date_end IS NOT NULL AND v_sub.date_end > v_now THEN
      IF v_tier.price_monthly >= v_sub.price_monthly THEN
        -- Upgrade: sisa hari paket lama dikonversi sesuai rasio harga
        v_mode := 'upgrade';
        v_final_tier_id := v_tier.id;
        v_final_slug := v_tier.slug;
        v_bonus := (v_sub.date_end - v_now)
          * (v_sub.price_monthly::float8 / GREATEST(v_tier.price_monthly, 1));
        v_end := v_now + v_paid + v_bonus;
      ELSE
        -- Downgrade terbayar: pertahankan tier lebih tinggi, konversi nilai bayar
        v_mode := 'converted';
        v_final_tier_id := v_sub.tier_id;
        v_final_slug := v_sub.slug;
        v_end := v_sub.date_end
          + v_paid * (v_tier.price_monthly::float8 / v_sub.price_monthly);
      END IF;

    ELSE
      -- Dari Free / tanpa langganan aktif
      v_mode := 'new';
      v_final_tier_id := v_tier.id;
      v_final_slug := v_tier.slug;
      v_end := v_now + v_paid;
    END IF;

    IF v_sub.id IS NOT NULL THEN
      UPDATE public.user_subscriptions
      SET tier_id = v_final_tier_id,
          status = 'active',
          date_start = CASE WHEN v_mode IN ('new', 'upgrade') THEN v_now ELSE date_start END,
          date_end = v_end,
          provider = 'sumopod',
          external_id = v_order.order_id
      WHERE id = v_sub.id;
    ELSE
      INSERT INTO public.user_subscriptions
        (user_id, tier_id, status, date_start, date_end, provider, external_id)
      VALUES
        (v_order.user_id, v_final_tier_id, 'active', v_now, v_end, 'sumopod', v_order.order_id);
    END IF;

    -- Tier berbayar baru aktif: isi kuota bulanan tier sekarang (tidak dikurangi)
    IF v_mode IN ('new', 'upgrade') THEN
      v_photo_quota := CASE v_final_slug WHEN 'starter' THEN 2 WHEN 'pro' THEN 5 END;
      v_upload_quota := CASE v_final_slug WHEN 'starter' THEN 10 WHEN 'pro' THEN 20 END;
      IF v_photo_quota IS NOT NULL THEN
        UPDATE public.profiles
        SET quota_pro_photo = GREATEST(COALESCE(quota_pro_photo, 0), v_photo_quota),
            quota_pro_photo_reset_at = v_now,
            quota_upload_cv = GREATEST(COALESCE(quota_upload_cv, 0), v_upload_quota),
            quota_upload_cv_reset_at = v_now
        WHERE id = v_order.user_id;
      END IF;
    END IF;

    v_result := jsonb_build_object(
      'tier', v_final_slug,
      'date_end', v_end,
      'mode', v_mode,
      'bonus_days', floor(extract(epoch FROM v_bonus) / 86400)::int
    );

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
      gateway_amount_idr = p_amount,
      -- Fee ditanggung pembeli → hitung dari selisih; selain itu pakai data gateway
      fee_idr = CASE WHEN p_amount > amount_idr THEN p_amount - amount_idr ELSE fee_idr END,
      net_amount_idr = CASE WHEN p_amount > amount_idr THEN amount_idr ELSE net_amount_idr END,
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


-- ─── Admin list: pakai aturan status yang sama ───────────────────────
CREATE OR REPLACE FUNCTION public.admin_list_payment_orders(
  p_search TEXT DEFAULT '',
  p_status TEXT DEFAULT 'all',      -- all | paid | pending | issue | other
  p_page INTEGER DEFAULT 1,
  p_page_size INTEGER DEFAULT 20
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_q TEXT := lower(trim(coalesce(p_search, '')));
  v_status TEXT := lower(trim(coalesce(p_status, 'all')));
  v_page INTEGER := greatest(coalesce(p_page, 1), 1);
  v_size INTEGER := least(greatest(coalesce(p_page_size, 20), 1), 100);
  v_result JSONB;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not_authorized' USING ERRCODE = '42501';
  END IF;

  WITH base AS (
    SELECT
      o.*,
      au.email::text AS user_email,
      coalesce(
        nullif(p.full_name, ''),
        nullif(au.raw_user_meta_data ->> 'full_name', ''),
        nullif(au.raw_user_meta_data ->> 'name', ''),
        ''
      ) AS user_name,
      public.payment_order_display_status(o.status, o.expires_at) AS display_status,
      wh.webhook_error,
      wh.webhook_count,
      CASE o.product_type
        WHEN 'tier' THEN (
          SELECT jsonb_build_object(
            'tier', st.slug,
            'status', us.status,
            'date_end', us.date_end,
            'external_id', us.external_id
          )
          FROM public.user_subscriptions us
          LEFT JOIN public.subscription_tiers st ON st.id = us.tier_id
          WHERE us.user_id = o.user_id AND us.status = 'active'
          ORDER BY us.date_end DESC NULLS LAST, us.created_at DESC
          LIMIT 1
        )
        WHEN 'addon_upload_cv' THEN jsonb_build_object(
          'has_upload_cv', p.has_upload_cv,
          'upload_cv_end_date', p.upload_cv_end_date
        )
        WHEN 'addon_pro_photo' THEN jsonb_build_object(
          'quota_pro_photo', p.quota_pro_photo,
          'quota_pro_photo_purchased', p.quota_pro_photo_purchased
        )
        WHEN 'tryout' THEN (
          SELECT jsonb_build_object(
            'credit_found', true,
            'total_credits', tc.total_credits,
            'used_credits', tc.used_credits,
            'status', tc.status
          )
          FROM public.tryout_credits tc
          WHERE tc.payment_ref = o.order_id
          ORDER BY tc.created_at DESC
          LIMIT 1
        )
      END AS current_state
    FROM public.payment_orders o
    LEFT JOIN auth.users au ON au.id = o.user_id
    LEFT JOIN public.profiles p ON p.id = o.user_id
    LEFT JOIN LATERAL (
      SELECT
        (array_agg(e.error ORDER BY e.received_at DESC) FILTER (WHERE e.error IS NOT NULL))[1]
          AS webhook_error,
        count(*) AS webhook_count
      FROM public.payment_webhook_events e
      WHERE e.order_id = o.order_id
    ) wh ON true
  ),
  flagged AS (
    SELECT
      b.*,
      CASE
        WHEN b.status = 'paid' AND b.fulfilled_at IS NULL
          THEN 'Status lunas tapi produk belum diaktifkan'
        WHEN b.last_event LIKE 'error:%'
          THEN 'Webhook gagal: ' || substr(b.last_event, 8)
        WHEN b.status <> 'paid' AND b.webhook_error IS NOT NULL
          THEN 'Webhook error: ' || b.webhook_error
        WHEN b.fulfilled_at IS NOT NULL AND b.product_type = 'tryout' AND b.current_state IS NULL
          THEN 'Kredit tryout untuk order ini tidak ditemukan'
        ELSE NULL
      END AS attention_reason
    FROM base b
  ),
  filtered AS (
    SELECT f.*
    FROM flagged f
    WHERE (
        v_q = ''
        OR f.order_id ILIKE '%' || v_q || '%'
        OR f.gateway_payment_id ILIKE '%' || v_q || '%'
        OR f.user_email ILIKE '%' || v_q || '%'
        OR f.user_name ILIKE '%' || v_q || '%'
        OR f.product_name ILIKE '%' || v_q || '%'
        OR f.user_id::text = v_q
      )
      AND (
        v_status = 'all'
        OR (v_status = 'paid' AND f.display_status = 'paid')
        OR (v_status = 'pending' AND f.display_status = 'pending')
        OR (v_status = 'issue' AND f.attention_reason IS NOT NULL)
        OR (v_status = 'other' AND f.display_status NOT IN ('paid', 'pending'))
      )
  ),
  page_rows AS (
    SELECT *
    FROM filtered
    ORDER BY created_at DESC
    OFFSET (v_page - 1) * v_size
    LIMIT v_size
  )
  SELECT jsonb_build_object(
    'rows', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'id', r.id,
        'order_id', r.order_id,
        'user_id', r.user_id,
        'user_email', r.user_email,
        'user_name', r.user_name,
        'product_type', r.product_type,
        'product_ref', r.product_ref,
        'product_name', r.product_name,
        'quantity', r.quantity,
        'amount_idr', r.amount_idr,
        'gateway_amount_idr', r.gateway_amount_idr,
        'fee_idr', r.fee_idr,
        'net_amount_idr', r.net_amount_idr,
        'status', r.status,
        'display_status', r.display_status,
        'payment_method', r.payment_method,
        'gateway_payment_id', r.gateway_payment_id,
        'expires_at', r.expires_at,
        'paid_at', r.paid_at,
        'fulfilled_at', r.fulfilled_at,
        'fulfillment_result', r.fulfillment_result,
        'last_event', r.last_event,
        'webhook_count', r.webhook_count,
        'webhook_error', r.webhook_error,
        'current_state', r.current_state,
        'attention_reason', r.attention_reason,
        'created_at', r.created_at
      ) ORDER BY r.created_at DESC)
      FROM page_rows r
    ), '[]'::jsonb),
    'total', (SELECT count(*) FROM filtered),
    'summary', (
      SELECT jsonb_build_object(
        'paid_count', count(*) FILTER (WHERE display_status = 'paid'),
        'paid_gross', coalesce(sum(coalesce(gateway_amount_idr, amount_idr))
                        FILTER (WHERE display_status = 'paid'), 0),
        'paid_net', coalesce(sum(amount_idr) FILTER (WHERE display_status = 'paid'), 0),
        'pending_count', count(*) FILTER (WHERE display_status = 'pending'),
        'issue_count', count(*) FILTER (WHERE attention_reason IS NOT NULL)
      )
      FROM flagged
    )
  )
  INTO v_result;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_payment_orders(TEXT, TEXT, INTEGER, INTEGER)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_payment_orders(TEXT, TEXT, INTEGER, INTEGER)
  TO authenticated, service_role;

COMMENT ON FUNCTION public.admin_list_payment_orders IS
  'Admin: daftar payment_orders + email pembeli, error webhook, dan kondisi produk saat ini. Menolak non-admin.';
