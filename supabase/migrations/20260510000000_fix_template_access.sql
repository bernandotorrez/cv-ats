-- =====================================================
-- Fix Template Access Control
-- Created: 2026-05-10
-- Purpose: Ensure correct template access per tier
-- =====================================================

-- Free tier: Only Jakarta and Bandung
UPDATE public.subscription_tiers 
SET template_access_detail = '["jakarta", "bandung"]'::jsonb
WHERE slug = 'free';

-- Starter tier: All except Semarang and Bali (Pro-only)
UPDATE public.subscription_tiers 
SET template_access_detail = '["jakarta", "bandung", "medan", "makassar", "surabaya", "yogya"]'::jsonb
WHERE slug = 'starter';

-- Pro tier: All templates (NULL = unlimited)
UPDATE public.subscription_tiers 
SET template_access_detail = NULL
WHERE slug = 'pro';

-- Pro Plus tier: All templates (NULL = unlimited)
UPDATE public.subscription_tiers 
SET template_access_detail = NULL
WHERE slug = 'pro_plus';

-- Add comment
COMMENT ON COLUMN public.subscription_tiers.template_access_detail IS 
  'JSON array of allowed template IDs. NULL = all templates allowed. Free: [jakarta, bandung]. Starter: all except semarang, bali. Pro/Pro+: all (NULL).';
