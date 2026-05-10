-- Add enable_keyword_extractor column to subscription_tiers
ALTER TABLE public.subscription_tiers
  ADD COLUMN IF NOT EXISTS enable_keyword_extractor BOOLEAN NOT NULL DEFAULT false;

-- Set values for existing tiers
UPDATE public.subscription_tiers SET
  enable_keyword_extractor = true
WHERE slug IN ('starter', 'pro', 'pro_plus');

-- Free tier stays with default (false)
