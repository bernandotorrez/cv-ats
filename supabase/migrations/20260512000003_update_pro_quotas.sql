-- Update All Tier Quotas
-- Change from unlimited to specific monthly quotas

-- 1. Add quota_interview_simulator column if not exists
ALTER TABLE public.subscription_tiers
  ADD COLUMN IF NOT EXISTS quota_interview_simulator INTEGER DEFAULT 0;

-- 2. Update Free tier quotas
UPDATE public.subscription_tiers SET
  max_cvs = 1,
  quota_ai_suggest = 5,
  quota_ai_score = 1,
  quota_ai_chat = 5,
  quota_ai_cover_letter = 0,
  quota_ai_keyword_extract = 0,
  quota_ai_polish = 5,
  quota_cv_review = 0,
  quota_guided_mode = 10,
  quota_interview_simulator = 0
WHERE slug = 'free';

-- 3. Update Free tier features JSON
UPDATE public.subscription_tiers SET
  features = '[
    "1 CV aktif",
    "2 Template Basic",
    "5x AI Saran/bulan",
    "1x ATS Scoring/bulan",
    "5x Perbaiki Teks AI/bulan",
    "10x Guided Mode/bulan",
    "5x AI Chat/bulan",
    "Export PDF dengan watermark"
  ]'::jsonb
WHERE slug = 'free';

-- 4. Update Pro tier with specific quotas (not unlimited)
UPDATE public.subscription_tiers SET
  max_cvs = 10,
  quota_ai_suggest = 200,
  quota_ai_score = 50,
  quota_ai_chat = 200,
  quota_ai_cover_letter = 50,
  quota_ai_keyword_extract = 100,
  quota_ai_polish = 200,
  quota_cv_review = 50,
  quota_guided_mode = 100,
  quota_interview_simulator = 50
WHERE slug = 'pro';

-- 5. Update prices
UPDATE public.subscription_tiers SET price_monthly = 14900 WHERE slug = 'starter';
UPDATE public.subscription_tiers SET price_monthly = 39000 WHERE slug = 'pro';

-- 6. Update features JSON for Starter tier
UPDATE public.subscription_tiers SET
  features = '[
    "3 CV aktif",
    "Semua Template Premium",
    "50x AI Saran/bulan",
    "10x ATS Scoring/bulan",
    "50x Perbaiki Teks AI/bulan",
    "30x Guided Mode/bulan",
    "10x Cover Letter AI/bulan",
    "10x CV Review HR/bulan",
    "20x Keyword Extractor/bulan",
    "50x AI Chat/bulan",
    "Export PDF tanpa watermark"
  ]'::jsonb
WHERE slug = 'starter';

-- 7. Update features JSON for Pro tier to reflect new quotas
UPDATE public.subscription_tiers SET
  features = '[
    "10 CV aktif",
    "200x AI Saran/bulan",
    "50x ATS Scoring/bulan",
    "200x Perbaiki Teks AI/bulan",
    "100x Guided Mode/bulan",
    "Semua Template Premium",
    "50x Cover Letter AI/bulan",
    "50x CV Review HR/bulan",
    "100x Keyword Extractor/bulan",
    "200x AI Chat/bulan",
    "50x Simulasi Wawancara/bulan",
    "CV Comparison",
    "CV Analytics",
    "Priority Support 24/7",
    "Export PDF & DOCX tanpa watermark"
  ]'::jsonb
WHERE slug = 'pro';

-- 8. Delete Pro+ tier if exists (no longer offered)
DELETE FROM public.subscription_tiers WHERE slug = 'pro_plus';

-- 9. Remove enable_linkedin_optimize column (feature removed)
-- Note: Commented out as this may have data. Uncomment if you want to remove the column.
-- ALTER TABLE public.subscription_tiers DROP COLUMN IF EXISTS enable_linkedin_optimize;
