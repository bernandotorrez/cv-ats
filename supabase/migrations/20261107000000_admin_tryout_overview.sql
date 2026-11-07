-- ─────────────────────────────────────────────────────────────────────────────
-- Admin tryout overview (RPC)
--
-- Sebelumnya halaman /admin/tryout menghitung statistik & jumlah soal dengan
-- menarik seluruh baris ke browser (tryout_attempts.score_total,
-- tryout_questions.exam_set_id/subtest). PostgREST membatasi 1.000 baris per
-- request sehingga angka menjadi salah begitu data > 1.000 baris.
--
-- RPC ini menghitung agregat di database. Hanya admin (user_roles) yang boleh
-- memanggil; selain admin → exception 'forbidden'.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_tryout_overview()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_stats jsonb;
  v_counts jsonb;
  v_reports integer;
BEGIN
  IF v_uid IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.user_roles ur WHERE ur.user_id = v_uid AND ur.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  SELECT jsonb_build_object(
    'total_attempts', COUNT(*),
    'total_completed', COUNT(*) FILTER (WHERE status IN ('completed', 'timed_out')),
    'in_progress', COUNT(*) FILTER (WHERE status = 'in_progress'),
    'attempts_7d', COUNT(*) FILTER (WHERE created_at > now() - interval '7 days'),
    'avg_score', COALESCE(ROUND(AVG(score_total) FILTER (WHERE status IN ('completed', 'timed_out'))), 0),
    'pass_rate', CASE
      WHEN COUNT(*) FILTER (WHERE status IN ('completed', 'timed_out')) = 0 THEN 0
      ELSE ROUND(100.0 * COUNT(*) FILTER (WHERE status IN ('completed', 'timed_out') AND pass_overall)
                 / COUNT(*) FILTER (WHERE status IN ('completed', 'timed_out')))
    END,
    'participants', COUNT(DISTINCT user_id) FILTER (WHERE status IN ('completed', 'timed_out'))
  )
  INTO v_stats
  FROM public.tryout_attempts;

  v_stats := v_stats || jsonb_build_object(
    'total_credits_active', (
      SELECT COALESCE(SUM(remaining_credits), 0)
      FROM public.tryout_credits
      WHERE status = 'active' AND (expired_at IS NULL OR expired_at > now())
    ),
    'users_with_credits', (
      SELECT COUNT(DISTINCT user_id)
      FROM public.tryout_credits
      WHERE status = 'active' AND remaining_credits > 0
        AND (expired_at IS NULL OR expired_at > now())
    )
  );

  SELECT COALESCE(jsonb_object_agg(exam_set_id, c), '{}'::jsonb)
  INTO v_counts
  FROM (
    SELECT exam_set_id,
      jsonb_build_object(
        'twk', COUNT(*) FILTER (WHERE subtest = 'twk'),
        'tiu', COUNT(*) FILTER (WHERE subtest = 'tiu'),
        'tkp', COUNT(*) FILTER (WHERE subtest = 'tkp'),
        'with_detail', COUNT(*) FILTER (WHERE explanation_detail IS NOT NULL)
      ) AS c
    FROM public.tryout_questions
    GROUP BY exam_set_id
  ) q;

  SELECT COUNT(*) INTO v_reports FROM public.tryout_question_reports WHERE status = 'open';

  RETURN jsonb_build_object(
    'stats', v_stats,
    'question_counts', v_counts,
    'open_reports', v_reports
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_tryout_overview() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_tryout_overview() TO authenticated;
