-- ─────────────────────────────────────────────────────────────────────────────
-- Tryout SKD — pembahasan detail & laporan soal
--
-- 1. tryout_questions.explanation_detail (jsonb): pembahasan terstruktur
--    (ringkasan, konsep, langkah, analisis tiap opsi, tips, referensi).
--    Dibuat oleh edge function tryout-explain (service_role) lalu di-cache.
--    Otomatis dikosongkan bila soal/opsi/kunci/skor diubah agar pembahasan
--    tidak pernah basi.
-- 2. tryout_question_reports: laporan soal bermasalah dari peserta.
--    Insert HANYA lewat RPC report_tryout_question (cek pernah mengerjakan
--    set tsb, batas 30 laporan / 24 jam, 1 laporan terbuka per soal per user).
-- 3. Kolom ini tidak pernah keluar saat ujian berlangsung (tryout-start hanya
--    memilih kolom publik; RLS soal tetap admin-only).
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── 1. Pembahasan detail ───────────────────────────────────────────────────
ALTER TABLE public.tryout_questions
  ADD COLUMN IF NOT EXISTS explanation_detail jsonb,
  ADD COLUMN IF NOT EXISTS explanation_detail_at timestamptz;

CREATE OR REPLACE FUNCTION public.tryout_questions_invalidate_detail()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF (NEW.question_text IS DISTINCT FROM OLD.question_text
      OR NEW.options IS DISTINCT FROM OLD.options
      OR NEW.correct_answer IS DISTINCT FROM OLD.correct_answer
      OR NEW.scores IS DISTINCT FROM OLD.scores)
     -- Update yang sekaligus mengisi detail baru tidak dikosongkan.
     AND NEW.explanation_detail IS NOT DISTINCT FROM OLD.explanation_detail THEN
    NEW.explanation_detail := NULL;
    NEW.explanation_detail_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tryout_questions_invalidate_detail ON public.tryout_questions;
CREATE TRIGGER trg_tryout_questions_invalidate_detail
  BEFORE UPDATE ON public.tryout_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.tryout_questions_invalidate_detail();

-- ─── 2. Laporan soal ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tryout_question_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.tryout_questions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (reason IN (
    'kunci_salah', 'soal_ambigu', 'opsi_bermasalah', 'typo', 'pembahasan_salah', 'lainnya'
  )),
  note text CHECK (note IS NULL OR char_length(note) <= 500),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'rejected')),
  admin_note text CHECK (admin_note IS NULL OR char_length(admin_note) <= 500),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_tryout_question_reports_status
  ON public.tryout_question_reports (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tryout_question_reports_question
  ON public.tryout_question_reports (question_id);
CREATE INDEX IF NOT EXISTS idx_tryout_question_reports_user
  ON public.tryout_question_reports (user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tryout_question_reports_one_open
  ON public.tryout_question_reports (user_id, question_id)
  WHERE status = 'open';

ALTER TABLE public.tryout_question_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own question reports" ON public.tryout_question_reports;
CREATE POLICY "Users can view own question reports"
  ON public.tryout_question_reports FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage question reports" ON public.tryout_question_reports;
CREATE POLICY "Admins can manage question reports"
  ON public.tryout_question_reports FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  );

REVOKE INSERT, UPDATE, DELETE ON public.tryout_question_reports FROM anon, authenticated;
GRANT SELECT ON public.tryout_question_reports TO authenticated;
GRANT ALL ON public.tryout_question_reports TO service_role;
-- Admin menulis lewat policy admin di atas.
GRANT UPDATE (status, admin_note, resolved_at, resolved_by) ON public.tryout_question_reports TO authenticated;

-- RPC: laporkan soal. Return jsonb { ok: true, id } atau RAISE dengan kode:
-- NOT_ELIGIBLE (belum pernah menyelesaikan set soal ini), RATE_LIMITED,
-- INVALID_REASON.
CREATE OR REPLACE FUNCTION public.report_tryout_question(
  p_question_id uuid,
  p_reason text,
  p_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_exam_set_id uuid;
  v_note text;
  v_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '28000';
  END IF;

  IF p_reason IS NULL OR p_reason NOT IN (
    'kunci_salah', 'soal_ambigu', 'opsi_bermasalah', 'typo', 'pembahasan_salah', 'lainnya'
  ) THEN
    RAISE EXCEPTION 'INVALID_REASON' USING ERRCODE = '22023';
  END IF;

  -- Buang karakter kontrol, rapikan spasi, batasi 500 karakter.
  v_note := NULLIF(left(btrim(regexp_replace(COALESCE(p_note, ''), '[[:cntrl:]]+', ' ', 'g')), 500), '');

  SELECT exam_set_id INTO v_exam_set_id
  FROM public.tryout_questions WHERE id = p_question_id;
  IF v_exam_set_id IS NULL THEN
    RAISE EXCEPTION 'NOT_ELIGIBLE' USING ERRCODE = '42501';
  END IF;

  -- Hanya peserta yang sudah menyelesaikan set ini (sudah melihat soalnya).
  IF NOT EXISTS (
    SELECT 1 FROM public.tryout_attempts
    WHERE user_id = v_uid
      AND exam_set_id = v_exam_set_id
      AND status IN ('completed', 'timed_out')
  ) THEN
    RAISE EXCEPTION 'NOT_ELIGIBLE' USING ERRCODE = '42501';
  END IF;

  IF (
    SELECT COUNT(*) FROM public.tryout_question_reports
    WHERE user_id = v_uid AND created_at > now() - interval '24 hours'
  ) >= 30 THEN
    RAISE EXCEPTION 'RATE_LIMITED' USING ERRCODE = '54000';
  END IF;

  INSERT INTO public.tryout_question_reports (question_id, user_id, reason, note)
  VALUES (p_question_id, v_uid, p_reason, v_note)
  ON CONFLICT (user_id, question_id) WHERE status = 'open'
  DO UPDATE SET reason = EXCLUDED.reason, note = EXCLUDED.note, created_at = now()
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('ok', true, 'id', v_id);
END;
$$;

REVOKE ALL ON FUNCTION public.report_tryout_question(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.report_tryout_question(uuid, text, text) TO authenticated;
