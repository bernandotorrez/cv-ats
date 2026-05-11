-- Add guided mode feature flag and quota to subscription_tiers
-- Guided mode is the step-by-step CV wizard that uses AI to extract CV data
-- from user answers. Each guided mode AI call is tracked separately from
-- general AI chat so the quotas don't interfere with each other.
ALTER TABLE public.subscription_tiers
  ADD COLUMN IF NOT EXISTS enable_guided_mode BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS quota_guided_mode INTEGER DEFAULT 10;

-- Free: 1 guided session (≈10 AI calls per session)
UPDATE public.subscription_tiers SET
  enable_guided_mode = true,
  quota_guided_mode = 10
WHERE slug = 'free';

-- Starter: ~3 guided sessions (≈30 AI calls)
UPDATE public.subscription_tiers SET
  enable_guided_mode = true,
  quota_guided_mode = 30
WHERE slug = 'starter';

-- Pro/Pro+: unlimited
UPDATE public.subscription_tiers SET
  enable_guided_mode = true,
  quota_guided_mode = NULL
WHERE slug IN ('pro', 'pro_plus');
