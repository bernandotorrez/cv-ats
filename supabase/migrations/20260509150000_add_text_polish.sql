-- Add text polish feature flag and quota to subscription_tiers
ALTER TABLE public.subscription_tiers
  ADD COLUMN IF NOT EXISTS enable_text_polish BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS quota_ai_polish INTEGER DEFAULT 20;

-- Set per-tier values
UPDATE public.subscription_tiers SET
  enable_text_polish = true,
  quota_ai_polish = 10
WHERE slug = 'free';

UPDATE public.subscription_tiers SET
  enable_text_polish = true,
  quota_ai_polish = 50
WHERE slug = 'starter';

UPDATE public.subscription_tiers SET
  enable_text_polish = true,
  quota_ai_polish = NULL
WHERE slug = 'pro';

UPDATE public.subscription_tiers SET
  enable_text_polish = true,
  quota_ai_polish = NULL
WHERE slug = 'pro_plus';

-- Add polish to ai_usage feature enum if needed (handled by check constraint or just track as string)
