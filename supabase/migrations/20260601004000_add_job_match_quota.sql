ALTER TABLE public.subscription_tiers
  ADD COLUMN IF NOT EXISTS quota_ai_job_match INTEGER DEFAULT 0;

UPDATE public.subscription_tiers SET
  quota_ai_job_match = 0
WHERE slug = 'free';

UPDATE public.subscription_tiers SET
  quota_ai_job_match = 20
WHERE slug = 'starter';

UPDATE public.subscription_tiers SET
  quota_ai_job_match = 100
WHERE slug = 'pro';

UPDATE public.subscription_tiers SET
  features = jsonb_insert(
    COALESCE(features, '[]'::jsonb),
    '{4}',
    '"20x AI Job Match Score/bulan"'::jsonb,
    true
  )
WHERE slug = 'starter'
  AND NOT COALESCE(features, '[]'::jsonb) ? '20x AI Job Match Score/bulan';

UPDATE public.subscription_tiers SET
  features = jsonb_insert(
    COALESCE(features, '[]'::jsonb),
    '{4}',
    '"100x AI Job Match Score/bulan"'::jsonb,
    true
  )
WHERE slug = 'pro'
  AND NOT COALESCE(features, '[]'::jsonb) ? '100x AI Job Match Score/bulan';
