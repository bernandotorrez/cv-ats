-- ============================================================
-- TASK-003e: Seed Data — CV Templates (8 template)
-- Reference: prd.md F-04, design.md
-- ============================================================

-- Insert 8 CV templates sesuai PRD
INSERT INTO public.templates (slug, name, description, color, is_premium, sort_order) VALUES
  -- T01: Profesional Bersih (Free)
  ('profesional-bersih', 'Profesional Bersih',
   'Format single-column klasik yang aman dan profesional. Cocok untuk corporate, finance, legal, dan BUMN.',
   '#335F24', false, 1),

  -- T02: Modern Dua Kolom (Free)
  ('modern-dua-kolom', 'Modern Dua Kolom',
   'Layout dua kolom dengan sidebar kiri untuk info kontak. Cocok untuk tech, marketing, dan startup.',
   '#468432', false, 2),

  -- T03: Minimalis Elegan (Free - 1 download)
  ('minimalis-elegan', 'Minimalis Elegan',
   'Single column dengan white-space maksimal dan typography elegan. Cocok untuk konsultan dan akademisi.',
   '#9AD872', false, 3),

  -- T04: Kreatif Terstruktur (Pro)
  ('kreatif-terstruktur', 'Kreatif Terstruktur',
   'Aksen warna subtle dengan struktur rapi. Cocok untuk design, creative agency, dan media.',
   '#FFA02E', true, 4),

  -- T05: Eksekutif Premium (Pro)
  ('eksekutif-premium', 'Eksekutif Premium',
   'Format executive dengan penekanan pada pencapaian dan leadership. Cocok untuk senior manager dan C-level.',
   '#335F24', true, 5),

  -- T06: Tech Specialist (Pro)
  ('tech-specialist', 'Tech Specialist',
   'Layout skills-first yang menonjolkan technical expertise. Cocok untuk software engineer dan data scientist.',
   '#468432', true, 6),

  -- T07: Fresh Graduate (Free)
  ('fresh-graduate', 'Fresh Graduate',
   'Education-first layout untuk lulusan baru. Menonjolkan organisasi, magang, dan proyek kuliah.',
   '#9AD872', false, 7),

  -- T08: Bilingual ID/EN (Pro)
  ('bilingual-id-en', 'Bilingual ID/EN',
   'Format dual-language untuk melamar ke perusahaan multinasional. Mendukung Bahasa Indonesia dan English.',
   '#468432', true, 8)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  color = EXCLUDED.color,
  is_premium = EXCLUDED.is_premium,
  sort_order = EXCLUDED.sort_order;

-- ============================================================
-- Seed: Subscription Tiers (ensure defaults exist)
-- ============================================================
-- Hanya membuat paket yang BELUM ada (database baru). Nilai paket yang sudah ada dikelola lewat
-- migrasi; dulu blok ini memakai ON CONFLICT DO UPDATE dengan nilai lama sehingga setiap seed
-- menimpa kuota & harga (lihat migration 20261006000200_realign_tier_limits.sql).
-- Nilai di bawah harus sama dengan src/lib/subscription.ts (TIER_LIMITS) dan src/routes/harga.tsx.
INSERT INTO public.subscription_tiers (slug, name, description, price_monthly, max_cvs, quota_ai_suggest, quota_ai_score, quota_ai_chat, quota_ai_cover_letter, quota_ai_keyword_extract, quota_cv_downloads, template_access, features, enable_cv_review, enable_cover_letter, enable_keyword_extractor, enable_cv_comparison, enable_interview_simulator, enable_analytics, enable_linkedin_optimize, enable_text_polish, quota_ai_polish, enable_guided_mode, quota_guided_mode, sort_order) VALUES
  ('free', 'Free', 'Paket gratis selamanya untuk mulai membuat CV ATS.', 0,
   1, 1, 1, 5, 0, 0, 1, 'basic',
   '["1 CV aktif", "2 template basic", "1x saran AI / bulan", "1x scoring / bulan", "1x perbaiki teks / bulan", "10x guided mode / bulan", "5x AI chat / bulan", "Export PDF dengan watermark"]'::jsonb,
   false, false, false, false, false, false, false,
   true, 1,
   true, 10,
   1),
  ('starter', 'Starter', 'Untuk job seeker serius yang butuh lebih banyak CV & AI.', 15000,
   3, 50, 10, 50, 10, 20, NULL, 'all',
   '["3 CV aktif", "Sebagian template premium", "50x saran AI / bulan", "10x scoring / bulan", "50x perbaiki teks / bulan", "30x guided mode / bulan", "10x cover letter / bulan", "10x CV review HR / bulan", "20x AI Job Match Score / bulan", "20x keyword extractor / bulan", "10x Upload CV / bulan", "2x Enhance Foto / bulan", "50x AI chat / bulan", "Export PDF tanpa watermark"]'::jsonb,
   true, true, true, false, false, false, false,
   true, 50,
   true, 30,
   2),
  ('pro', 'Pro', 'Untuk profesional & career switcher yang ingin fitur lengkap.', 35000,
   10, 200, 50, 200, 50, 100, NULL, 'all',
   '["10 CV aktif", "Semua template premium", "200x saran AI / bulan", "50x scoring / bulan", "200x perbaiki teks / bulan", "100x guided mode / bulan", "50x cover letter / bulan", "50x CV review HR / bulan", "100x AI Job Match Score / bulan", "30x Auto Tailor CV / bulan", "100x keyword extractor / bulan", "20x Upload CV / bulan", "5x Enhance Foto / bulan", "50x simulasi wawancara / bulan", "200x AI chat / bulan", "CV comparison dan analitik CV", "Dukungan prioritas 24/7"]'::jsonb,
   true, true, true, true, true, true, true,
   true, 200,
   true, 100,
   3),
  ('pro_plus', 'Pro+', 'Paket terlengkap dengan LinkedIn Optimizer.', 99000,
   NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'all',
   '["Semua fitur Pro", "LinkedIn Profile Optimizer", "AI Interview Simulator", "CV Analytics", "Priority Support 24/7", "Export PDF & DOCX", "Custom Branding"]'::jsonb,
   true, true, true, true, true, true, true,
   true, NULL,
   true, NULL,
   4)
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE public.subscription_tiers
  ADD COLUMN IF NOT EXISTS quota_ai_tailor_cv INTEGER DEFAULT 0;

UPDATE public.subscription_tiers SET quota_ai_tailor_cv = 0 WHERE slug IN ('free', 'starter');
UPDATE public.subscription_tiers SET quota_ai_tailor_cv = 30 WHERE slug = 'pro';

-- Kolom kuota yang ditambahkan migrasi belakangan: isi untuk paket yang baru dibuat di atas.
-- (Database lama sudah diatur oleh migrasinya masing-masing; nilai ini sama.)
UPDATE public.subscription_tiers SET quota_cv_review = 0, quota_ai_job_match = 0, quota_interview_simulator = 0, enable_cv_translate = false, quota_ai_translate = 0 WHERE slug = 'free';
UPDATE public.subscription_tiers SET quota_cv_review = 10, quota_ai_job_match = 20, quota_interview_simulator = 0, enable_cv_translate = true, quota_ai_translate = 3 WHERE slug = 'starter';
UPDATE public.subscription_tiers SET quota_cv_review = 50, quota_ai_job_match = 100, quota_interview_simulator = 50, enable_cv_translate = true, quota_ai_translate = 15 WHERE slug IN ('pro', 'pro_plus');
