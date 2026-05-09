-- =====================================================
-- Add Premium CV Templates
-- Created: 2026-05-08
-- Purpose: Add 4 new CV templates for starter and pro tiers
-- =====================================================

-- Add template_access_detail column to allow granular template access
ALTER TABLE public.subscription_tiers 
ADD COLUMN IF NOT EXISTS template_access_detail JSONB DEFAULT NULL;

-- Update free tier features to mention specific basic templates
UPDATE public.subscription_tiers 
SET features = '["1 CV aktif", "2 Template Basic (Jakarta, Bandung)", "5 AI Saran/bulan", "1 AI Scoring/bulan", "5 AI Chat/bulan", "1 Cover Letter/bulan", "Export PDF", "ATS Friendly Check"]'::jsonb,
    template_access_detail = '["jakarta", "bandung"]'::jsonb
WHERE slug = 'free';

-- Update starter tier features to include new templates (medan, makassar)
UPDATE public.subscription_tiers 
SET features = '["3 CV aktif", "6 Template (Jakarta, Bandung, Medan, Makassar + Premium)", "50 AI Saran/bulan", "10 AI Scoring/bulan", "50 AI Chat/bulan", "10 Cover Letter/bulan", "Export PDF tanpa watermark", "ATS Friendly Check", "Keyword Extractor", "LinkedIn Import"]'::jsonb,
    template_access_detail = '["jakarta", "bandung", "medan", "makassar", "surabaya", "yogya"]'::jsonb
WHERE slug = 'starter';

-- Update pro tier features to include all templates (semarang, bali)
UPDATE public.subscription_tiers 
SET features = '["CV Unlimited", "8 Template Premium Lengkap", "AI Unlimited", "AI Chat Unlimited", "Cover Letter Unlimited", "Export PDF tanpa watermark", "ATS Friendly Check", "Keyword Extractor", "LinkedIn Import", "Prioritas Support", "CV Version History"]'::jsonb,
    template_access_detail = NULL  -- NULL means all templates
WHERE slug = 'pro';

-- Add comment to column
COMMENT ON COLUMN public.subscription_tiers.template_access_detail IS 
  'JSON array of allowed template IDs. NULL = all templates allowed.';
