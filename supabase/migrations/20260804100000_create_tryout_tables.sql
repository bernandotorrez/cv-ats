-- Phase: Tryout SKD (Seleksi Kompetensi Dasar) untuk simulasi ujian CPNS
-- Skema database untuk fitur tryout lengkap dengan 110 soal (TWK/TIU/TKP).

-- ─────────────────────────────────────────────────────────────────────────────
-- Tabel: tryout_packages
-- Definisi paket tryout yang dijual (satuan/lengkap/dst).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.tryout_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL DEFAULT 0,
  credits INTEGER NOT NULL DEFAULT 1,
  features JSONB DEFAULT '[]'::jsonb,
  has_pembahasan BOOLEAN DEFAULT false,
  has_analytics BOOLEAN DEFAULT false,
  has_leaderboard BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_tryout_packages_active ON public.tryout_packages(is_active, sort_order);

ALTER TABLE public.tryout_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active tryout packages"
  ON public.tryout_packages FOR SELECT
  USING (is_active = true);

-- Admin only write (dikelola via service role / edge function)
CREATE POLICY "Admins can manage tryout packages"
  ON public.tryout_packages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- Tabel: tryout_exam_sets
-- Kumpulan set soal (1 set = 110 soal TWK/TIU/TKP).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.tryout_exam_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  total_questions INTEGER DEFAULT 110,
  duration_minutes INTEGER DEFAULT 100,
  twk_count INTEGER DEFAULT 30,
  tiu_count INTEGER DEFAULT 35,
  tkp_count INTEGER DEFAULT 45,
  passing_grade_twk INTEGER DEFAULT 65,
  passing_grade_tiu INTEGER DEFAULT 80,
  passing_grade_tkp INTEGER DEFAULT 166,
  is_active BOOLEAN DEFAULT true,
  is_free_preview BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_tryout_exam_sets_active ON public.tryout_exam_sets(is_active, sort_order);

ALTER TABLE public.tryout_exam_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active exam sets"
  ON public.tryout_exam_sets FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage exam sets"
  ON public.tryout_exam_sets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- Tabel: tryout_questions
-- Bank soal. correct_answer null untuk TKP (skor dari `scores`).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.tryout_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_set_id UUID NOT NULL REFERENCES public.tryout_exam_sets(id) ON DELETE CASCADE,
  subtest TEXT NOT NULL CHECK (subtest IN ('twk', 'tiu', 'tkp')),
  question_number INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  question_image_url TEXT,
  options JSONB NOT NULL,
  correct_answer TEXT,
  scores JSONB,
  explanation TEXT,
  explanation_image_url TEXT,
  category TEXT,
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  created_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT tryout_questions_unique UNIQUE (exam_set_id, question_number)
);

CREATE INDEX idx_tryout_questions_set ON public.tryout_questions(exam_set_id, question_number);
CREATE INDEX idx_tryout_questions_subtest ON public.tryout_questions(exam_set_id, subtest);

ALTER TABLE public.tryout_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read questions"
  ON public.tryout_questions FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage questions"
  ON public.tryout_questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- Tabel: tryout_credits
-- Kredit yang dibeli user (FIFO saat dipakai).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.tryout_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES public.tryout_packages(id),
  total_credits INTEGER NOT NULL DEFAULT 1,
  used_credits INTEGER NOT NULL DEFAULT 0,
  remaining_credits INTEGER GENERATED ALWAYS AS (total_credits - used_credits) STORED,
  payment_method TEXT DEFAULT 'manual',
  payment_ref TEXT,
  activated_at TIMESTAMPTZ,
  expired_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT valid_credits CHECK (used_credits >= 0 AND used_credits <= total_credits)
);

CREATE INDEX idx_tryout_credits_user_active
  ON public.tryout_credits(user_id, status, created_at);

ALTER TABLE public.tryout_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credits"
  ON public.tryout_credits FOR SELECT
  USING (auth.uid() = user_id);

-- Insert/update hanya lewat service_role / admin
CREATE POLICY "Admins can manage credits"
  ON public.tryout_credits FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- Tabel: tryout_attempts
-- Percobaan ujian user (1 attempt aktif per user per exam set).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.tryout_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_set_id UUID NOT NULL REFERENCES public.tryout_exam_sets(id),
  credit_id UUID REFERENCES public.tryout_credits(id),
  status TEXT NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'completed', 'timed_out', 'abandoned')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  answers JSONB DEFAULT '{}'::jsonb,
  flagged_questions JSONB DEFAULT '[]'::jsonb,
  score_twk INTEGER DEFAULT 0,
  score_tiu INTEGER DEFAULT 0,
  score_tkp INTEGER DEFAULT 0,
  score_total INTEGER DEFAULT 0,
  pass_twk BOOLEAN DEFAULT false,
  pass_tiu BOOLEAN DEFAULT false,
  pass_tkp BOOLEAN DEFAULT false,
  pass_overall BOOLEAN DEFAULT false,
  stats JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_tryout_attempts_user ON public.tryout_attempts(user_id, created_at DESC);
CREATE INDEX idx_tryout_attempts_exam ON public.tryout_attempts(exam_set_id, score_total DESC);
CREATE INDEX idx_tryout_attempts_status ON public.tryout_attempts(user_id, exam_set_id, status);

-- Partial unique: 1 attempt in_progress per (user, exam set)
CREATE UNIQUE INDEX idx_tryout_attempts_one_active
  ON public.tryout_attempts(user_id, exam_set_id)
  WHERE status = 'in_progress';

ALTER TABLE public.tryout_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own attempts"
  ON public.tryout_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attempts"
  ON public.tryout_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own in-progress attempts"
  ON public.tryout_attempts FOR UPDATE
  USING (auth.uid() = user_id AND status = 'in_progress')
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all attempts"
  ON public.tryout_attempts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- View: tryout_leaderboard (auto-refresh via REFRESH MATERIALIZED VIEW).
-- Memakai view biasa (read-only) untuk hindari biaya materialized view refresh.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.tryout_leaderboard AS
SELECT
  ta.user_id,
  COALESCE(p.full_name, 'User CV Pintar') AS full_name,
  p.avatar_url,
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
  ) AS ranking,
  ta.id AS attempt_id
FROM public.tryout_attempts ta
LEFT JOIN public.profiles p ON p.id = ta.user_id
JOIN public.tryout_exam_sets es ON es.id = ta.exam_set_id
WHERE ta.status IN ('completed', 'timed_out');

GRANT SELECT ON public.tryout_leaderboard TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- Trigger: auto-update updated_at pada tryout_packages
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_tryout_packages_updated_at
  BEFORE UPDATE ON public.tryout_packages
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- Seed: tryout_packages
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.tryout_packages (slug, name, description, price, credits, features, has_pembahasan, has_analytics, has_leaderboard, sort_order)
VALUES
  (
    'satuan',
    'Tryout Satuan',
    '1x akses tryout SKD lengkap 110 soal dengan timer 100 menit dan hasil skor langsung.',
    15000,
    1,
    '["110 soal TWK + TIU + TKP", "Timer 100 menit realistis", "Hasil skor langsung keluar", "Passing grade sesuai BKN"]'::jsonb,
    false,
    false,
    false,
    1
  ),
  (
    'lengkap',
    'Paket Lengkap',
    '5x akses tryout + pembahasan lengkap + analisis kelemahan + akses leaderboard nasional.',
    50000,
    5,
    '["5x akses tryout SKD", "Pembahasan lengkap setiap soal", "Analisis kelemahan per kategori", "Akses leaderboard nasional", "Statistik per attempt"]'::jsonb,
    true,
    true,
    true,
    2
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- Seed: tryout_exam_sets (1 set contoh)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.tryout_exam_sets (slug, name, description, is_active, sort_order)
VALUES
  ('cpns-skd-set-1', 'Tryout SKD Set 1', 'Set latihan SKD pertama dengan 110 soal campuran TWK, TIU, dan TKP sesuai kisi-kisi BKN terbaru.', true, 1);