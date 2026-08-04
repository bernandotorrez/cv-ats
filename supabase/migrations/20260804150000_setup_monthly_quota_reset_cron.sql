-- Migration: Setup monthly quota reset cron job
-- This will run on the 1st of every month at 00:05 UTC

-- First, enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create function to trigger the monthly quota reset
CREATE OR REPLACE FUNCTION public.trigger_monthly_quota_reset()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, vault
AS $$
DECLARE
  function_url text := 'https://nfdrkuvyowaydjkhfvrr.supabase.co/functions/v1/reset-monthly-quota';
  cron_secret text;
BEGIN
  -- Get the cron secret from vault
  SELECT decrypted_secret
  INTO cron_secret
  FROM vault.decrypted_secrets
  WHERE name = 'CRON_SECRET'
  LIMIT 1;

  IF cron_secret IS NULL OR length(cron_secret) < 16 THEN
    RAISE EXCEPTION 'CRON_SECRET belum diset di Supabase Vault.';
  END IF;

  -- Call the edge function
  PERFORM net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', cron_secret
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
END;
$$;

REVOKE ALL ON FUNCTION public.trigger_monthly_quota_reset() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.trigger_monthly_quota_reset() TO postgres;

-- Schedule the cron job to run on the 1st of every month at 00:05 UTC
SELECT cron.schedule(
  'monthly-quota-reset',           -- job name
  '5 0 1 * *',                     -- cron expression: 5 minutes past midnight on 1st of month
  'SELECT public.trigger_monthly_quota_reset()'
);

-- Also create a function to manually expire subscriptions (can be called from admin)
CREATE OR REPLACE FUNCTION public.expire_subscription(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_free_tier_id UUID;
  v_current_tier_id UUID;
BEGIN
  -- Get free tier ID
  SELECT id INTO v_free_tier_id
  FROM subscription_tiers
  WHERE slug = 'free'
  LIMIT 1;

  -- Get user's current active subscription tier
  SELECT tier_id INTO v_current_tier_id
  FROM user_subscriptions
  WHERE user_id = p_user_id
    AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;

  -- If user is on paid tier, downgrade to free
  IF v_current_tier_id IS NOT NULL AND v_current_tier_id != v_free_tier_id THEN
    -- Expire current subscription
    UPDATE user_subscriptions
    SET status = 'expired'
    WHERE user_id = p_user_id
      AND status = 'active'
      AND tier_id = v_current_tier_id;

    -- Create new free subscription
    INSERT INTO user_subscriptions (
      user_id,
      tier_id,
      status,
      date_start,
      date_end,
      provider
    ) VALUES (
      p_user_id,
      v_free_tier_id,
      'active',
      NOW(),
      NULL,  -- Free tier never expires
      'auto_downgrade'
    );

    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

REVOKE ALL ON FUNCTION public.expire_subscription(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.expire_subscription(UUID) TO service_role;
