-- Update Starter and Pro pricing tiers to 15.000 and 35.000 respectively
UPDATE public.subscription_tiers SET price_monthly = 15000 WHERE slug = 'starter';
UPDATE public.subscription_tiers SET price_monthly = 35000 WHERE slug = 'pro';
