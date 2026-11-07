-- ─────────────────────────────────────────────────────────────────────────────
-- Tolak memulai set tryout yang soalnya belum lengkap
--
-- Sebelumnya start_tryout_attempt hanya menolak set yang BELUM PUNYA SOAL sama
-- sekali (NO_QUESTIONS). Set yang sedang di-generate (mis. baru 30 dari 110
-- soal) tetap bisa dimulai dan kredit user terpotong untuk tryout yang tidak
-- lengkap. Kini attempt BARU ditolak ('SET_INCOMPLETE') bila jumlah soal per
-- subtes masih di bawah komposisi set (twk_count / tiu_count / tkp_count).
-- Melanjutkan attempt yang sudah berjalan tetap diizinkan. Pengecekan terjadi
-- SEBELUM kredit dipotong.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.start_tryout_attempt(
  p_user_id uuid,
  p_exam_set_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempt public.tryout_attempts%ROWTYPE;
  v_credit_id uuid;
  v_set public.tryout_exam_sets%ROWTYPE;
  v_twk integer;
  v_tiu integer;
  v_tkp integer;
BEGIN
  IF p_user_id IS NULL OR p_exam_set_id IS NULL THEN
    RAISE EXCEPTION 'invalid_arguments' USING ERRCODE = '22023';
  END IF;

  -- Semua start untuk user ini diserialisasi (berlaku sampai akhir transaksi).
  PERFORM pg_advisory_xact_lock(hashtextextended('tryout_start:' || p_user_id::text, 0));

  SELECT * INTO v_set
  FROM public.tryout_exam_sets
  WHERE id = p_exam_set_id AND is_active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'EXAM_SET_NOT_FOUND';
  END IF;

  -- Resume attempt sah yang masih berjalan.
  SELECT * INTO v_attempt
  FROM public.tryout_attempts
  WHERE user_id = p_user_id
    AND exam_set_id = p_exam_set_id
    AND status = 'in_progress'
    AND credit_id IS NOT NULL
  LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'attempt_id', v_attempt.id,
      'credit_id', v_attempt.credit_id,
      'started_at', v_attempt.started_at,
      'answers', COALESCE(v_attempt.answers, '{}'::jsonb),
      'flagged_questions', COALESCE(v_attempt.flagged_questions, '[]'::jsonb),
      'resumed', true
    );
  END IF;

  -- Jangan potong kredit untuk set yang belum punya soal / belum lengkap.
  SELECT
    COUNT(*) FILTER (WHERE subtest = 'twk'),
    COUNT(*) FILTER (WHERE subtest = 'tiu'),
    COUNT(*) FILTER (WHERE subtest = 'tkp')
  INTO v_twk, v_tiu, v_tkp
  FROM public.tryout_questions
  WHERE exam_set_id = p_exam_set_id;

  IF v_twk + v_tiu + v_tkp = 0 THEN
    RAISE EXCEPTION 'NO_QUESTIONS';
  END IF;

  IF v_twk < COALESCE(v_set.twk_count, 0)
     OR v_tiu < COALESCE(v_set.tiu_count, 0)
     OR v_tkp < COALESCE(v_set.tkp_count, 0) THEN
    RAISE EXCEPTION 'SET_INCOMPLETE';
  END IF;

  -- Attempt in_progress tanpa kredit = dibuat langsung oleh client sebelum fix.
  UPDATE public.tryout_attempts
  SET status = 'abandoned',
      finished_at = COALESCE(finished_at, now())
  WHERE user_id = p_user_id
    AND exam_set_id = p_exam_set_id
    AND status = 'in_progress'
    AND credit_id IS NULL;

  -- Pilih kredit FIFO lalu konsumsi dengan compare-and-set.
  SELECT c.id INTO v_credit_id
  FROM public.tryout_credits c
  WHERE c.user_id = p_user_id
    AND c.status = 'active'
    AND c.used_credits < c.total_credits
    AND (c.expired_at IS NULL OR c.expired_at > now())
  ORDER BY c.created_at ASC, c.id ASC
  LIMIT 1
  FOR UPDATE;

  IF v_credit_id IS NULL THEN
    RAISE EXCEPTION 'NO_CREDITS';
  END IF;

  UPDATE public.tryout_credits
  SET used_credits = used_credits + 1
  WHERE id = v_credit_id
    AND used_credits < total_credits;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NO_CREDITS';
  END IF;

  INSERT INTO public.tryout_attempts
    (user_id, exam_set_id, credit_id, status, answers, flagged_questions)
  VALUES
    (p_user_id, p_exam_set_id, v_credit_id, 'in_progress', '{}'::jsonb, '[]'::jsonb)
  RETURNING * INTO v_attempt;

  RETURN jsonb_build_object(
    'attempt_id', v_attempt.id,
    'credit_id', v_attempt.credit_id,
    'started_at', v_attempt.started_at,
    'answers', '{}'::jsonb,
    'flagged_questions', '[]'::jsonb,
    'resumed', false
  );
END;
$$;

REVOKE ALL ON FUNCTION public.start_tryout_attempt(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.start_tryout_attempt(uuid, uuid) TO service_role;
