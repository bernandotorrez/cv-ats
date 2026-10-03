-- ─────────────────────────────────────────────────────────────────────────────
-- Tryout security hardening (security-audit C5, C6, H3, H4, M6)
--
-- * C5: soal (kunci jawaban, skor TKP, pembahasan) tidak lagi bisa dibaca
--       langsung oleh user login. Soal hanya keluar lewat edge function
--       (service_role). Admin tetap lewat policy "Admins can manage questions".
-- * C6: user tidak bisa INSERT/UPDATE tryout_attempts. Autosave jawaban lewat
--       RPC save_tryout_answers (hanya kolom answers & flagged_questions, hanya
--       attempt in_progress milik sendiri, hanya sebelum batas waktu + 60 detik).
-- * H3: start_tryout_attempt (service_role only) memotong kredit secara atomik
--       (compare-and-set) dan membuat attempt dalam satu transaksi.
-- * M6: leaderboard lewat RPC get_tryout_leaderboard (tanpa UUID user, cek
--       entitlement has_leaderboard); SELECT pada view dicabut dari client.
--
-- Catatan: migration 20261004000000 menjalankan
--   ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS ...
-- sehingga setiap fungsi di bawah diberi REVOKE/GRANT eksplisit.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── C5: soal hanya via edge function ───────────────────────────────────────
DROP POLICY IF EXISTS "Authenticated users can read questions" ON public.tryout_questions;

-- ─── C6: attempt hanya dibuat/diubah server ─────────────────────────────────
DROP POLICY IF EXISTS "Users can insert own attempts" ON public.tryout_attempts;
DROP POLICY IF EXISTS "Users can update own in-progress attempts" ON public.tryout_attempts;

-- ─────────────────────────────────────────────────────────────────────────────
-- RPC: save_tryout_answers — autosave jawaban dari client.
-- Return true jika tersimpan; false jika attempt tidak ditemukan / bukan milik
-- pemanggil / sudah selesai / waktu sudah habis (deadline + 60 detik).
-- Jawaban & flag difilter: hanya id soal milik exam set attempt tersebut,
-- nilai jawaban berupa string pendek (kunci opsi A–E).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.save_tryout_answers(
  p_attempt_id uuid,
  p_answers jsonb,
  p_flagged jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_exam_set_id uuid;
  v_started_at timestamptz;
  v_duration_minutes integer;
  v_answers jsonb;
  v_flagged jsonb;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '28000';
  END IF;

  IF p_attempt_id IS NULL THEN
    RAISE EXCEPTION 'invalid_attempt_id' USING ERRCODE = '22023';
  END IF;

  IF p_answers IS NULL THEN
    p_answers := '{}'::jsonb;
  END IF;
  IF p_flagged IS NULL THEN
    p_flagged := '[]'::jsonb;
  END IF;

  IF jsonb_typeof(p_answers) <> 'object' OR jsonb_typeof(p_flagged) <> 'array' THEN
    RAISE EXCEPTION 'invalid_payload' USING ERRCODE = '22023';
  END IF;

  -- 110 soal × (uuid + 1 huruf) jauh di bawah batas ini.
  IF pg_column_size(p_answers) > 32768 OR pg_column_size(p_flagged) > 16384 THEN
    RAISE EXCEPTION 'payload_too_large' USING ERRCODE = '22023';
  END IF;

  SELECT a.exam_set_id, a.started_at, COALESCE(s.duration_minutes, 100)
    INTO v_exam_set_id, v_started_at, v_duration_minutes
  FROM public.tryout_attempts a
  JOIN public.tryout_exam_sets s ON s.id = a.exam_set_id
  WHERE a.id = p_attempt_id
    AND a.user_id = v_uid
    AND a.status = 'in_progress'
  FOR UPDATE OF a;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF now() > v_started_at
             + make_interval(mins => v_duration_minutes)
             + interval '60 seconds' THEN
    RETURN false;
  END IF;

  SELECT COALESCE(jsonb_object_agg(e.key, e.value), '{}'::jsonb)
    INTO v_answers
  FROM jsonb_each(p_answers) AS e
  JOIN public.tryout_questions q
    ON q.id::text = e.key
   AND q.exam_set_id = v_exam_set_id
  WHERE jsonb_typeof(e.value) = 'string'
    AND length(e.value #>> '{}') BETWEEN 1 AND 8;

  SELECT COALESCE(jsonb_agg(DISTINCT f.value), '[]'::jsonb)
    INTO v_flagged
  FROM jsonb_array_elements(p_flagged) AS f
  JOIN public.tryout_questions q
    ON q.id::text = (f.value #>> '{}')
   AND q.exam_set_id = v_exam_set_id
  WHERE jsonb_typeof(f.value) = 'string';

  UPDATE public.tryout_attempts
  SET answers = v_answers,
      flagged_questions = v_flagged
  WHERE id = p_attempt_id
    AND user_id = v_uid
    AND status = 'in_progress';

  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.save_tryout_answers(uuid, jsonb, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_tryout_answers(uuid, jsonb, jsonb) TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- RPC: start_tryout_attempt — dipanggil HANYA oleh edge function tryout-start
-- (service_role). Dalam satu transaksi:
--   1. Lock per user (serialisasi start paralel).
--   2. Resume attempt in_progress yang sah (punya credit_id) jika ada.
--   3. Attempt in_progress tanpa kredit (hasil insert langsung sebelum fix C6)
--      ditandai 'abandoned' agar tidak memblokir unique index.
--   4. Kredit FIFO: used_credits + 1 dengan guard used_credits < total_credits.
--   5. Insert attempt baru.
-- Return jsonb: { attempt_id, credit_id, started_at, answers, flagged_questions, resumed }
-- Error: 'EXAM_SET_NOT_FOUND', 'NO_QUESTIONS', 'NO_CREDITS'.
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
BEGIN
  IF p_user_id IS NULL OR p_exam_set_id IS NULL THEN
    RAISE EXCEPTION 'invalid_arguments' USING ERRCODE = '22023';
  END IF;

  -- Semua start untuk user ini diserialisasi (berlaku sampai akhir transaksi).
  PERFORM pg_advisory_xact_lock(hashtextextended('tryout_start:' || p_user_id::text, 0));

  IF NOT EXISTS (
    SELECT 1 FROM public.tryout_exam_sets
    WHERE id = p_exam_set_id AND is_active = true
  ) THEN
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

  -- Jangan potong kredit untuk set yang belum punya soal.
  IF NOT EXISTS (
    SELECT 1 FROM public.tryout_questions WHERE exam_set_id = p_exam_set_id
  ) THEN
    RAISE EXCEPTION 'NO_QUESTIONS';
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

-- ─────────────────────────────────────────────────────────────────────────────
-- M6: leaderboard via RPC (tanpa user UUID, cek entitlement has_leaderboard).
-- Return jsonb: { entitled: boolean, entries: [ { ranking, full_name,
--   avatar_url, exam_set_id, exam_name, score_total, score_twk, score_tiu,
--   score_tkp, pass_overall, duration_seconds, finished_at, is_me } ] }
-- Ranking per exam set (sama seperti view lama). Attempt tanpa credit_id
-- (tidak sah) tidak ikut diperingkat.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_tryout_leaderboard(
  p_exam_set_id uuid DEFAULT NULL,
  p_limit integer DEFAULT 50
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_limit integer := LEAST(GREATEST(COALESCE(p_limit, 50), 1), 100);
  v_entitled boolean;
  v_entries jsonb;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '28000';
  END IF;

  v_entitled :=
    EXISTS (
      SELECT 1
      FROM public.tryout_credits c
      JOIN public.tryout_packages p ON p.id = c.package_id
      WHERE c.user_id = v_uid
        AND c.status <> 'refunded'
        AND p.has_leaderboard = true
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = v_uid AND ur.role = 'admin'
    );

  IF NOT v_entitled THEN
    RETURN jsonb_build_object('entitled', false, 'entries', '[]'::jsonb);
  END IF;

  WITH ranked AS (
    SELECT
      ta.user_id,
      ta.exam_set_id,
      es.name AS exam_name,
      ta.score_total,
      ta.score_twk,
      ta.score_tiu,
      ta.score_tkp,
      ta.pass_overall,
      ta.duration_seconds,
      ta.finished_at,
      RANK() OVER (
        PARTITION BY ta.exam_set_id
        ORDER BY ta.score_total DESC, ta.duration_seconds ASC NULLS LAST
      ) AS ranking
    FROM public.tryout_attempts ta
    JOIN public.tryout_exam_sets es ON es.id = ta.exam_set_id
    WHERE ta.status IN ('completed', 'timed_out')
      AND ta.credit_id IS NOT NULL
      AND (p_exam_set_id IS NULL OR ta.exam_set_id = p_exam_set_id)
  ),
  top_rows AS (
    SELECT *
    FROM ranked
    ORDER BY ranking ASC, score_total DESC, finished_at ASC NULLS LAST
    LIMIT v_limit
  )
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'ranking', t.ranking,
        'full_name', COALESCE(NULLIF(btrim(pr.full_name), ''), 'User CV Pintar'),
        'avatar_url', pr.avatar_url,
        'exam_set_id', t.exam_set_id,
        'exam_name', t.exam_name,
        'score_total', t.score_total,
        'score_twk', t.score_twk,
        'score_tiu', t.score_tiu,
        'score_tkp', t.score_tkp,
        'pass_overall', t.pass_overall,
        'duration_seconds', t.duration_seconds,
        'finished_at', t.finished_at,
        'is_me', (t.user_id = v_uid)
      )
      ORDER BY t.ranking ASC, t.score_total DESC, t.finished_at ASC NULLS LAST
    ),
    '[]'::jsonb
  )
  INTO v_entries
  FROM top_rows t
  LEFT JOIN public.profiles pr ON pr.id = t.user_id;

  RETURN jsonb_build_object('entitled', true, 'entries', v_entries);
END;
$$;

REVOKE ALL ON FUNCTION public.get_tryout_leaderboard(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_tryout_leaderboard(uuid, integer) TO authenticated;

-- View lama: jangan bisa dibaca langsung oleh client; jika suatu saat
-- di-grant lagi, jalankan dengan hak pemanggil (RLS berlaku).
REVOKE ALL ON public.tryout_leaderboard FROM PUBLIC, anon, authenticated;
DO $$
BEGIN
  EXECUTE 'ALTER VIEW public.tryout_leaderboard SET (security_invoker = true)';
EXCEPTION WHEN others THEN
  RAISE NOTICE 'security_invoker not applied to tryout_leaderboard: %', SQLERRM;
END;
$$;
