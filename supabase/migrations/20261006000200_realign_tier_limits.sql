-- Selaraskan batas, harga, dan teks fitur paket dengan yang diiklankan di halaman Harga
-- (src/routes/harga.tsx) dan fallback di kode (src/lib/subscription.ts TIER_LIMITS).
--
-- Masalah: supabase/seed.sql melakukan upsert (ON CONFLICT DO UPDATE) dengan nilai lama
-- (Free: Saran AI 10, Skor 3, Perbaiki Teks 10, Cover Letter 1, Keyword 2; Starter Rp19.000;
-- Pro Rp49.000 & tanpa batas). Setiap kali seed dijalankan, nilai itu menimpa migrasi
-- 20260512000003 / 20260701000000 / 20260805000000. Akibatnya user Free bisa memakai Saran AI
-- dan Perbaiki Teks 10x per bulan, padahal yang dijanjikan 1x — dan harga yang ditagih
-- (payment-create membaca price_monthly) bisa berbeda dari yang tertulis di halaman Harga.
-- seed.sql kini hanya mengisi paket yang belum ada (ON CONFLICT DO NOTHING).

UPDATE public.subscription_tiers SET
  price_monthly = 0,
  max_cvs = 1,
  quota_ai_suggest = 1,
  quota_ai_score = 1,
  quota_ai_chat = 5,
  quota_ai_polish = 1,
  quota_guided_mode = 10,
  quota_ai_cover_letter = 0,
  quota_ai_keyword_extract = 0,
  quota_cv_review = 0,
  quota_ai_job_match = 0,
  quota_ai_tailor_cv = 0,
  quota_interview_simulator = 0,
  quota_cv_downloads = 1,
  features = '[
    "1 CV aktif",
    "2 template basic",
    "1x saran AI / bulan",
    "1x scoring / bulan",
    "1x perbaiki teks / bulan",
    "10x guided mode / bulan",
    "5x AI chat / bulan",
    "Export PDF dengan watermark"
  ]'::jsonb
WHERE slug = 'free';

UPDATE public.subscription_tiers SET
  price_monthly = 15000,
  max_cvs = 3,
  quota_ai_suggest = 50,
  quota_ai_score = 10,
  quota_ai_chat = 50,
  quota_ai_polish = 50,
  quota_guided_mode = 30,
  quota_ai_cover_letter = 10,
  quota_ai_keyword_extract = 20,
  quota_cv_review = 10,
  quota_ai_job_match = 20,
  quota_ai_tailor_cv = 0,
  quota_interview_simulator = 0,
  quota_cv_downloads = NULL,
  features = '[
    "3 CV aktif",
    "Sebagian template premium",
    "50x saran AI / bulan",
    "10x scoring / bulan",
    "50x perbaiki teks / bulan",
    "30x guided mode / bulan",
    "10x cover letter / bulan",
    "10x CV review HR / bulan",
    "20x AI Job Match Score / bulan",
    "20x keyword extractor / bulan",
    "10x Upload CV / bulan",
    "2x Enhance Foto / bulan",
    "50x AI chat / bulan",
    "Export PDF tanpa watermark"
  ]'::jsonb
WHERE slug = 'starter';

UPDATE public.subscription_tiers SET
  price_monthly = 35000,
  max_cvs = 10,
  quota_ai_suggest = 200,
  quota_ai_score = 50,
  quota_ai_chat = 200,
  quota_ai_polish = 200,
  quota_guided_mode = 100,
  quota_ai_cover_letter = 50,
  quota_ai_keyword_extract = 100,
  quota_cv_review = 50,
  quota_ai_job_match = 100,
  quota_ai_tailor_cv = 30,
  quota_interview_simulator = 50,
  quota_cv_downloads = NULL,
  features = '[
    "10 CV aktif",
    "Semua template premium",
    "200x saran AI / bulan",
    "50x scoring / bulan",
    "200x perbaiki teks / bulan",
    "100x guided mode / bulan",
    "50x cover letter / bulan",
    "50x CV review HR / bulan",
    "100x AI Job Match Score / bulan",
    "30x Auto Tailor CV / bulan",
    "100x keyword extractor / bulan",
    "20x Upload CV / bulan",
    "5x Enhance Foto / bulan",
    "50x simulasi wawancara / bulan",
    "200x AI chat / bulan",
    "CV comparison dan analitik CV",
    "Dukungan prioritas 24/7"
  ]'::jsonb
WHERE slug = 'pro';
