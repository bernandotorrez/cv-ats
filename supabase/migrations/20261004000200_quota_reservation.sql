-- =====================================================
-- Security: atomic quota reservation (H3)
-- Created: 2026-10-04
--
-- Sebelumnya: cek kuota → panggil layanan berbayar → kurangi kuota.
-- Request paralel semuanya lolos cek. Sekarang kuota DIRESERVASI
-- secara atomik SEBELUM layanan berbayar dipanggil, dan dikembalikan
-- (refund/release) jika layanan gagal.
--
-- Semua fungsi di sini hanya untuk service_role (edge functions).
-- =====================================================

-- ai_usage.feature dulu dibatasi 5 nilai, sehingga insert untuk fitur
-- lain (cv_review, polish, job_match, tailor_cv, interview_simulator,
-- parse_cv, ...) gagal diam-diam dan kuotanya tidak pernah terhitung.
ALTER TABLE public.ai_usage DROP CONSTRAINT IF EXISTS ai_usage_feature_check;
ALTER TABLE public.ai_usage
  ADD CONSTRAINT ai_usage_feature_check CHECK (feature ~ '^[a-z_]{1,40}$');

-- ─── Kuota AI bulanan berbasis ai_usage ──────────────────────────────
-- Mengunci per (user, feature), menghitung pemakaian bulan ini, lalu
-- mencatat pemakaian baru — semuanya dalam satu transaksi.
-- Return: id baris ai_usage (untuk release), atau NULL jika kuota habis.
CREATE OR REPLACE FUNCTION public.reserve_ai_quota(
  p_user UUID,
  p_feature TEXT,
  p_limit INTEGER,
  p_tokens INTEGER DEFAULT 0
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_id UUID;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('ai_quota:' || p_user::text || ':' || p_feature));

  IF p_limit IS NOT NULL THEN
    SELECT count(*) INTO v_count
    FROM public.ai_usage
    WHERE user_id = p_user
      AND feature = p_feature
      AND created_at >= date_trunc('month', now());

    IF v_count >= p_limit THEN
      RETURN NULL;
    END IF;
  END IF;

  INSERT INTO public.ai_usage (user_id, feature, tokens_used)
  VALUES (p_user, p_feature, COALESCE(p_tokens, 0))
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reserve_ai_quota(UUID, TEXT, INTEGER, INTEGER)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_ai_quota(UUID, TEXT, INTEGER, INTEGER) TO service_role;

-- ─── Kuota berbasis kolom profiles ───────────────────────────────────
-- Kurangi 1 hanya jika > 0. Return true jika berhasil.
CREATE OR REPLACE FUNCTION public.consume_profile_quota(p_user UUID, p_column TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ok BOOLEAN;
BEGIN
  IF p_column NOT IN ('quota_upload_cv', 'quota_pro_photo', 'quota_pro_photo_purchased') THEN
    RAISE EXCEPTION 'invalid quota column: %', p_column;
  END IF;

  EXECUTE format(
    'UPDATE public.profiles SET %1$I = %1$I - 1 WHERE id = $1 AND %1$I > 0 RETURNING true',
    p_column
  ) INTO v_ok USING p_user;

  RETURN COALESCE(v_ok, false);
END;
$$;

CREATE OR REPLACE FUNCTION public.refund_profile_quota(p_user UUID, p_column TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_column NOT IN ('quota_upload_cv', 'quota_pro_photo', 'quota_pro_photo_purchased') THEN
    RAISE EXCEPTION 'invalid quota column: %', p_column;
  END IF;

  EXECUTE format(
    'UPDATE public.profiles SET %1$I = COALESCE(%1$I, 0) + 1 WHERE id = $1',
    p_column
  ) USING p_user;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.consume_profile_quota(UUID, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.refund_profile_quota(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_profile_quota(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.refund_profile_quota(UUID, TEXT) TO service_role;
