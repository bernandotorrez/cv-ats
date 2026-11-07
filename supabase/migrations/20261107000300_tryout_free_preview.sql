-- ─────────────────────────────────────────────────────────────────────────────
-- Tryout "Preview gratis" benar-benar gratis
--
-- Sebelumnya flag tryout_exam_sets.is_free_preview hanya tersimpan; memulai
-- set tersebut tetap memotong kredit. Kini:
-- * tryout_attempts.is_free menandai attempt gratis (tanpa credit_id).
-- * start_tryout_attempt: set is_free_preview → attempt dibuat TANPA kredit
--   (cek kelengkapan soal tetap berlaku). Resume berlaku untuk attempt
--   berbayar maupun gratis.
-- * Leaderboard & insight peringkat ikut menghitung attempt gratis yang sah.
-- Pembahasan detail tetap mengikuti paket kredit (attempt gratis = tanpa
-- pembahasan), dicek di edge function.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.tryout_attempts
  ADD COLUMN IF NOT EXISTS is_free boolean NOT NULL DEFAULT false;

-- Attempt sah = punya kredit ATAU gratis.
ALTER TABLE public.tryout_attempts
  DROP CONSTRAINT IF EXISTS tryout_attempts_free_has_no_credit;
ALTER TABLE public.tryout_attempts
  ADD CONSTRAINT tryout_attempts_free_has_no_credit
  CHECK (NOT is_free OR credit_id IS NULL);

DROP INDEX IF EXISTS public.idx_tryout_attempts_set_finished;
CREATE INDEX IF NOT EXISTS idx_tryout_attempts_set_finished
  ON public.tryout_attempts (exam_set_id, user_id, score_total DESC)
  WHERE status IN ('completed', 'timed_out') AND (credit_id IS NOT NULL OR is_free);

-- ─── start_tryout_attempt ───────────────────────────────────────────────────
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
    AND (credit_id IS NOT NULL OR is_free)
  LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'attempt_id', v_attempt.id,
      'credit_id', v_attempt.credit_id,
      'started_at', v_attempt.started_at,
      'answers', COALESCE(v_attempt.answers, '{}'::jsonb),
      'flagged_questions', COALESCE(v_attempt.flagged_questions, '[]'::jsonb),
      'resumed', true,
      'is_free', v_attempt.is_free
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

  -- Set gratis (preview): attempt dibuat TANPA memotong kredit.
  IF v_set.is_free_preview THEN
    INSERT INTO public.tryout_attempts
      (user_id, exam_set_id, credit_id, is_free, status, answers, flagged_questions)
    VALUES
      (p_user_id, p_exam_set_id, NULL, true, 'in_progress', '{}'::jsonb, '[]'::jsonb)
    RETURNING * INTO v_attempt;

    RETURN jsonb_build_object(
      'attempt_id', v_attempt.id,
      'credit_id', NULL,
      'started_at', v_attempt.started_at,
      'answers', '{}'::jsonb,
      'flagged_questions', '[]'::jsonb,
      'resumed', false,
      'is_free', true
    );
  END IF;

  -- Attempt in_progress tanpa kredit & bukan gratis = dibuat langsung oleh
  -- client sebelum fix keamanan → ditandai abandoned.
  UPDATE public.tryout_attempts
  SET status = 'abandoned',
      finished_at = COALESCE(finished_at, now())
  WHERE user_id = p_user_id
    AND exam_set_id = p_exam_set_id
    AND status = 'in_progress'
    AND credit_id IS NULL
    AND NOT is_free;

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
    'resumed', false,
    'is_free', false
  );
END;
$$;

REVOKE ALL ON FUNCTION public.start_tryout_attempt(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.start_tryout_attempt(uuid, uuid) TO service_role;

-- ─── Insight peringkat (attempt gratis ikut dihitung) ───────────────────────
CREATE OR REPLACE FUNCTION public.get_tryout_attempt_insights(
  p_user_id uuid,
  p_attempt_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exam_set_id uuid;
  v_score integer;
  v_duration integer;
  v_result jsonb;
BEGIN
  SELECT exam_set_id, score_total, duration_seconds
    INTO v_exam_set_id, v_score, v_duration
  FROM public.tryout_attempts
  WHERE id = p_attempt_id
    AND user_id = p_user_id
    AND status IN ('completed', 'timed_out');

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  WITH best AS (
    SELECT DISTINCT ON (ta.user_id)
      ta.user_id, ta.score_total, ta.score_twk, ta.score_tiu, ta.score_tkp,
      ta.pass_overall, ta.duration_seconds
    FROM public.tryout_attempts ta
    WHERE ta.exam_set_id = v_exam_set_id
      AND ta.status IN ('completed', 'timed_out')
      AND (ta.credit_id IS NOT NULL OR ta.is_free)
      AND ta.user_id <> p_user_id
    ORDER BY ta.user_id, ta.score_total DESC, ta.duration_seconds ASC NULLS LAST
  )
  SELECT jsonb_build_object(
    'participants', COUNT(*) + 1,
    'rank', COUNT(*) FILTER (
      WHERE b.score_total > v_score
         OR (b.score_total = v_score AND COALESCE(b.duration_seconds, 2147483647) < COALESCE(v_duration, 2147483647))
    ) + 1,
    'percentile', CASE
      WHEN COUNT(*) = 0 THEN 100
      ELSE ROUND(100.0 * COUNT(*) FILTER (WHERE b.score_total < v_score) / COUNT(*))
    END,
    'pass_rate', CASE
      WHEN COUNT(*) = 0 THEN NULL
      ELSE ROUND(100.0 * COUNT(*) FILTER (WHERE b.pass_overall) / COUNT(*))
    END,
    'avg', CASE
      WHEN COUNT(*) = 0 THEN NULL
      ELSE jsonb_build_object(
        'total', ROUND(AVG(b.score_total)),
        'twk', ROUND(AVG(b.score_twk)),
        'tiu', ROUND(AVG(b.score_tiu)),
        'tkp', ROUND(AVG(b.score_tkp))
      )
    END,
    'top_score', GREATEST(COALESCE(MAX(b.score_total), 0), v_score)
  )
  INTO v_result
  FROM best b;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_tryout_attempt_insights(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_tryout_attempt_insights(uuid, uuid) TO service_role;

-- ─── Leaderboard (attempt gratis ikut dihitung) ─────────────────────────────
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
  v_me jsonb;
  v_total integer;
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

  WITH best AS (
    SELECT DISTINCT ON (ta.exam_set_id, ta.user_id)
      ta.user_id, ta.exam_set_id, es.name AS exam_name, ta.score_total,
      ta.score_twk, ta.score_tiu, ta.score_tkp, ta.pass_overall,
      ta.duration_seconds, ta.finished_at
    FROM public.tryout_attempts ta
    JOIN public.tryout_exam_sets es ON es.id = ta.exam_set_id
    WHERE ta.status IN ('completed', 'timed_out')
      AND (ta.credit_id IS NOT NULL OR ta.is_free)
      AND (p_exam_set_id IS NULL OR ta.exam_set_id = p_exam_set_id)
    ORDER BY ta.exam_set_id, ta.user_id, ta.score_total DESC,
             ta.duration_seconds ASC NULLS LAST, ta.finished_at ASC NULLS LAST
  ),
  ranked AS (
    SELECT b.*,
      RANK() OVER (
        PARTITION BY b.exam_set_id
        ORDER BY b.score_total DESC, b.duration_seconds ASC NULLS LAST
      ) AS ranking
    FROM best b
  ),
  shaped AS (
    SELECT r.user_id, r.ranking, r.score_total, r.finished_at,
      jsonb_build_object(
        'ranking', r.ranking,
        'full_name', public.tryout_mask_name(pr.full_name),
        'avatar_url', pr.avatar_url,
        'exam_set_id', r.exam_set_id,
        'exam_name', r.exam_name,
        'score_total', r.score_total,
        'score_twk', r.score_twk,
        'score_tiu', r.score_tiu,
        'score_tkp', r.score_tkp,
        'pass_overall', r.pass_overall,
        'duration_seconds', r.duration_seconds,
        'finished_at', r.finished_at,
        'is_me', (r.user_id = v_uid)
      ) AS entry
    FROM ranked r
    LEFT JOIN public.profiles pr ON pr.id = r.user_id
  ),
  top_rows AS (
    SELECT * FROM shaped
    ORDER BY ranking ASC, score_total DESC, finished_at ASC NULLS LAST
    LIMIT v_limit
  )
  SELECT
    COALESCE(
      (SELECT jsonb_agg(t.entry ORDER BY t.ranking ASC, t.score_total DESC,
                        t.finished_at ASC NULLS LAST)
       FROM top_rows t),
      '[]'::jsonb
    ),
    -- Posisi terbaik user sendiri (ditampilkan walau di luar top-N).
    (SELECT s.entry FROM shaped s WHERE s.user_id = v_uid
     ORDER BY s.ranking ASC, s.score_total DESC LIMIT 1),
    (SELECT COUNT(DISTINCT s.user_id) FROM shaped s)
  INTO v_entries, v_me, v_total;

  RETURN jsonb_build_object(
    'entitled', true,
    'entries', v_entries,
    'my_entry', v_me,
    'total_participants', COALESCE(v_total, 0)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_tryout_leaderboard(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_tryout_leaderboard(uuid, integer) TO authenticated;
