-- Add explicit feature flag columns to subscription_tiers
-- These serve as the single source of truth for feature availability,
-- replacing the need to derive feature access from quota columns.
ALTER TABLE public.subscription_tiers
  ADD COLUMN IF NOT EXISTS enable_cv_review BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS enable_cover_letter BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS enable_cv_comparison BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS enable_interview_simulator BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS enable_analytics BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS enable_linkedin_optimize BOOLEAN NOT NULL DEFAULT false;

-- Set values for existing tiers based on current business logic
UPDATE public.subscription_tiers SET
  enable_cv_review = true,
  enable_cover_letter = true,
  enable_cv_comparison = false,
  enable_interview_simulator = false,
  enable_analytics = false,
  enable_linkedin_optimize = false
WHERE slug = 'starter';

UPDATE public.subscription_tiers SET
  enable_cv_review = true,
  enable_cover_letter = true,
  enable_cv_comparison = true,
  enable_interview_simulator = false,
  enable_analytics = false,
  enable_linkedin_optimize = false
WHERE slug = 'pro';

UPDATE public.subscription_tiers SET
  enable_cv_review = true,
  enable_cover_letter = true,
  enable_cv_comparison = true,
  enable_interview_simulator = true,
  enable_analytics = true,
  enable_linkedin_optimize = true
WHERE slug = 'pro_plus';

-- Free tier stays with all defaults (false)
