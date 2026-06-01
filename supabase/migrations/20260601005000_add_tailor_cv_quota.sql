ALTER TABLE public.subscription_tiers
  ADD COLUMN IF NOT EXISTS quota_ai_tailor_cv INTEGER DEFAULT 0;

UPDATE public.subscription_tiers SET
  quota_ai_tailor_cv = 0
WHERE slug = 'free';

UPDATE public.subscription_tiers SET
  quota_ai_tailor_cv = 0
WHERE slug = 'starter';

UPDATE public.subscription_tiers SET
  quota_ai_tailor_cv = 30
WHERE slug = 'pro';

UPDATE public.subscription_tiers SET
  features = jsonb_insert(
    COALESCE(features, '[]'::jsonb),
    '{5}',
    '"30x Auto Tailor CV/bulan"'::jsonb,
    true
  )
WHERE slug = 'pro'
  AND NOT COALESCE(features, '[]'::jsonb) ? '30x Auto Tailor CV/bulan';
