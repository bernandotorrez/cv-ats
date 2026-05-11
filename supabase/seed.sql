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
INSERT INTO public.subscription_tiers (slug, name, description, price_monthly, max_cvs, quota_ai_suggest, quota_ai_score, quota_ai_chat, quota_ai_cover_letter, quota_ai_keyword_extract, template_access, features, enable_cv_review, enable_cover_letter, enable_keyword_extractor, enable_cv_comparison, enable_interview_simulator, enable_analytics, enable_linkedin_optimize, enable_text_polish, quota_ai_polish, enable_guided_mode, quota_guided_mode, sort_order) VALUES
  ('free', 'Free', 'Paket gratis selamanya untuk mulai membuat CV ATS.', 0,
   1, 10, 3, 5, 1, 2, 'basic',
   '["1 CV aktif", "10 AI Saran/bulan", "3 AI Scoring/bulan", "2 Template Basic", "5 AI Chat/bulan", "10 Perbaiki Teks/bulan", "Export PDF"]'::jsonb,
   false, false, false, false, false, false, false,
   true, 10,
   true, 10,
   1),
  ('starter', 'Starter', 'Untuk job seeker serius yang butuh lebih banyak CV & AI.', 19000,
   3, 50, 10, 50, 10, 20, 'all',
   '["3 CV aktif", "50 AI Saran/bulan", "10 AI Scoring/bulan", "Semua Template", "50 AI Chat/bulan", "10 Cover Letter/bulan", "CV Review HR Expert", "50 Perbaiki Teks/bulan", "Export PDF & DOCX", "Tanpa Watermark"]'::jsonb,
   true, true, true, false, false, false, false,
   true, 50,
   true, 30,
   2),
  ('pro', 'Pro', 'Untuk profesional & career switcher yang ingin fitur lengkap.', 49000,
   NULL, NULL, NULL, NULL, NULL, NULL, 'all',
   '["CV Unlimited", "AI Saran Unlimited", "AI Scoring Unlimited", "Semua Template Premium", "AI Chat Unlimited", "Cover Letter Unlimited", "CV Review HR Expert", "Keyword Extractor", "CV Comparison", "Perbaiki Teks Unlimited", "LinkedIn Profile Optimizer", "AI Interview Simulator", "CV Analytics", "Priority Support 24/7", "Export PDF & DOCX"]'::jsonb,
   true, true, true, true, true, true, true,
   true, NULL,
   true, NULL,
   3),
  ('pro_plus', 'Pro+', 'Paket terlengkap dengan LinkedIn Optimizer.', 99000,
   NULL, NULL, NULL, NULL, NULL, NULL, 'all',
   '["Semua fitur Pro", "LinkedIn Profile Optimizer", "AI Interview Simulator", "CV Analytics", "Priority Support 24/7", "Export PDF & DOCX", "Custom Branding"]'::jsonb,
   true, true, true, true, true, true, true,
   true, NULL,
   true, NULL,
   4)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  max_cvs = EXCLUDED.max_cvs,
  quota_ai_suggest = EXCLUDED.quota_ai_suggest,
  quota_ai_score = EXCLUDED.quota_ai_score,
  quota_ai_chat = EXCLUDED.quota_ai_chat,
  quota_ai_cover_letter = EXCLUDED.quota_ai_cover_letter,
  quota_ai_keyword_extract = EXCLUDED.quota_ai_keyword_extract,
  template_access = EXCLUDED.template_access,
  features = EXCLUDED.features,
  enable_cv_review = EXCLUDED.enable_cv_review,
  enable_cover_letter = EXCLUDED.enable_cover_letter,
  enable_keyword_extractor = EXCLUDED.enable_keyword_extractor,
  enable_cv_comparison = EXCLUDED.enable_cv_comparison,
  enable_interview_simulator = EXCLUDED.enable_interview_simulator,
  enable_analytics = EXCLUDED.enable_analytics,
  enable_linkedin_optimize = EXCLUDED.enable_linkedin_optimize,
  enable_text_polish = EXCLUDED.enable_text_polish,
  quota_ai_polish = EXCLUDED.quota_ai_polish,
  enable_guided_mode = EXCLUDED.enable_guided_mode,
  quota_guided_mode = EXCLUDED.quota_guided_mode,
  sort_order = EXCLUDED.sort_order;
