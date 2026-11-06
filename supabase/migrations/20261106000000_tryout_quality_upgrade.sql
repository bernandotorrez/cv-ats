-- ─────────────────────────────────────────────────────────────────────────────
-- Tryout SKD — upgrade kualitas hasil & keamanan
--
-- 1. save_tryout_answers: nilai jawaban wajib tepat satu huruf A–E (sebelumnya
--    string 1–8 karakter apa saja). Payload tetap dibatasi ukuran.
-- 2. get_tryout_attempt_insights (service_role only): posisi peserta (rank,
--    persentil), rata-rata skor peserta lain, dan tingkat kelulusan per set.
--    Dipakai edge function tryout-result untuk halaman hasil.
-- 3. get_tryout_leaderboard: satu baris per user per set (attempt terbaik),
--    nama disamarkan ("Budi S."), tambah total_participants & my_entry
--    (posisi user sendiri walau di luar top-N). Format lama tetap kompatibel.
-- 4. Index untuk query rank/persentil.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── 1. Autosave lebih ketat ───────────────────────────────────────────────
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

  p_answers := COALESCE(p_answers, '{}'::jsonb);
  p_flagged := COALESCE(p_flagged, '[]'::jsonb);

  IF jsonb_typeof(p_answers) <> 'object' OR jsonb_typeof(p_flagged) <> 'array' THEN
    RAISE EXCEPTION 'invalid_payload' USING ERRCODE = '22023';
  END IF;

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

  SELECT COALESCE(jsonb_object_agg(e.key, to_jsonb(upper(e.value #>> '{}'))), '{}'::jsonb)
    INTO v_answers
  FROM jsonb_each(p_answers) AS e
  JOIN public.tryout_questions q
    ON q.id::text = e.key
   AND q.exam_set_id = v_exam_set_id
  WHERE jsonb_typeof(e.value) = 'string'
    AND upper(e.value #>> '{}') ~ '^[A-E]$';

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

-- ─── Helper: samarkan nama untuk tampilan publik ────────────────────────────
-- "Budi Santoso Wijaya" → "Budi S." ; "budi" → "Budi" ; kosong → "Pejuang SKD"
CREATE OR REPLACE FUNCTION public.tryout_mask_name(p_name text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN p_name IS NULL OR btrim(p_name) = '' THEN 'Pejuang SKD'
    ELSE
      initcap(left(split_part(regexp_replace(btrim(p_name), '\s+', ' ', 'g'), ' ', 1), 20))
      || CASE
           WHEN split_part(regexp_replace(btrim(p_name), '\s+', ' ', 'g'), ' ', 2) <> ''
           THEN ' ' || upper(left(split_part(regexp_replace(btrim(p_name), '\s+', ' ', 'g'), ' ', 2), 1)) || '.'
           ELSE ''
         END
  END;
$$;

REVOKE ALL ON FUNCTION public.tryout_mask_name(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tryout_mask_name(text) TO authenticated, service_role;

-- ─── 2. Insight attempt (service_role only) ─────────────────────────────────
-- Return jsonb:
-- { participants, rank, percentile, pass_rate,
--   avg: { total, twk, tiu, tkp }, top_score }
-- Hanya attempt sah (punya credit_id) yang sudah selesai; satu attempt
-- terbaik per user agar user yang mengulang tidak menggelembungkan statistik.
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
      AND ta.credit_id IS NOT NULL
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

-- ─── 3. Leaderboard: attempt terbaik per user, nama disamarkan ─────────────
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
      AND ta.credit_id IS NOT NULL
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

-- ─── 4. Index ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_tryout_attempts_set_finished
  ON public.tryout_attempts (exam_set_id, user_id, score_total DESC)
  WHERE status IN ('completed', 'timed_out') AND credit_id IS NOT NULL;
