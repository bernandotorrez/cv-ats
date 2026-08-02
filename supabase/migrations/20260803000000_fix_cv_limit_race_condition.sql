-- Security fix: Add advisory lock to check_cv_limit to prevent race condition
-- Concurrent INSERTs could previously bypass the CV limit check.

CREATE OR REPLACE FUNCTION public.check_cv_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cv_count INTEGER;
  v_tier_slug TEXT;
  v_max_cvs INTEGER;
  v_lock_key BIGINT;
BEGIN
  -- Use advisory lock to prevent race condition on CV count check
  -- Lock is per-user, so only concurrent inserts for the same user are serialized
  v_lock_key := hashtext('cv_limit_' || NEW.user_id::text);
  PERFORM pg_advisory_xact_lock(v_lock_key);

  -- Count existing CVs for the user
  SELECT COUNT(*) INTO v_cv_count
  FROM public.cvs
  WHERE user_id = NEW.user_id;

  -- Get user tier (join user_subscriptions and subscription_tiers)
  SELECT st.slug INTO v_tier_slug
  FROM public.user_subscriptions us
  JOIN public.subscription_tiers st ON us.tier_id = st.id
  WHERE us.user_id = NEW.user_id AND us.status = 'active'
  ORDER BY us.created_at DESC
  LIMIT 1;

  -- Default to free if no active subscription
  IF v_tier_slug IS NULL THEN
    v_tier_slug := 'free';
  END IF;

  -- Set limit based on tier
  IF v_tier_slug = 'pro' THEN
    v_max_cvs := 10;
  ELSIF v_tier_slug = 'starter' THEN
    v_max_cvs := 3;
  ELSE
    v_max_cvs := 1;
  END IF;

  IF v_cv_count >= v_max_cvs THEN
    RAISE EXCEPTION 'Batas pembuatan CV tercapai (Free: 1, Starter: 3, Pro: 10). Silakan upgrade paket Anda.';
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger is already created, this migration just updates the function
-- No need to drop/recreate the trigger
