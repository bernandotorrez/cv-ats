-- ═════════════════════════════════════════════════════════════════════════════
-- Admin: daftar semua pembayaran + cek apakah produknya benar-benar aktif
-- ═════════════════════════════════════════════════════════════════════════════
-- Dashboard SumoPod hanya menampilkan order_id & nominal, tidak tahu produk apa
-- yang dibeli dan apakah aktivasinya berhasil. Fungsi ini menggabungkan:
--   - payment_orders (produk, status, fulfillment_result)
--   - email/nama pembeli (auth.users, profiles)
--   - error webhook terakhir (payment_webhook_events, service_role only)
--   - kondisi produk saat ini di akun pembeli (tier / add-on / kredit tryout)
-- dan menandai order yang perlu dicek (needs_attention).
--
-- Security: SECURITY DEFINER, tapi menolak pemanggil yang bukan admin.

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
      -- pending yang sudah lewat expires_at dianggap kedaluwarsa (sama seperti /pembayaran)
      CASE
        WHEN o.status = 'pending' AND o.expires_at IS NOT NULL AND o.expires_at <= now()
          THEN 'expired'
        ELSE o.status
      END AS display_status,
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
