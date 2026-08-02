-- Fix: protect_profile_quotas trigger blocks service_role updates
-- Edge functions using service_role client should bypass this trigger
-- because they are trusted backend operations.

CREATE OR REPLACE FUNCTION public.protect_profile_quotas()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow admins (via auth.uid()) to update any column
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  -- Allow service_role (backend/edge functions) to update any column
  -- auth.role() returns 'service_role' when called from edge functions with service_role key
  -- auth.uid() is NULL for service_role, so we check role first
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- For non-admins, ensure sensitive columns are not modified.
  -- We use IS DISTINCT FROM so that if the client sends the same existing value, it doesn't fail.
  IF NEW.quota_upload_cv IS DISTINCT FROM OLD.quota_upload_cv OR
     NEW.quota_pro_photo IS DISTINCT FROM OLD.quota_pro_photo OR
     NEW.quota_upload_cv_reset_at IS DISTINCT FROM OLD.quota_upload_cv_reset_at OR
     NEW.quota_pro_photo_reset_at IS DISTINCT FROM OLD.quota_pro_photo_reset_at OR
     NEW.has_upload_cv IS DISTINCT FROM OLD.has_upload_cv OR
     NEW.has_pro_photo IS DISTINCT FROM OLD.has_pro_photo OR
     NEW.upload_cv_end_date IS DISTINCT FROM OLD.upload_cv_end_date OR
     NEW.pro_photo_end_date IS DISTINCT FROM OLD.pro_photo_end_date
  THEN
    RAISE EXCEPTION 'Not authorized to modify quota or subscription fields';
  END IF;

  RETURN NEW;
END;
$$;

-- Also fix check_cv_limit trigger to allow service_role bypass
-- (service_role should be able to create unlimited CVs for admin operations)
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
  -- Allow service_role (backend/edge functions) to bypass CV limit
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Use advisory lock to prevent race condition on CV count check
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

-- Also fix protect_user_subscriptions_tier to allow service_role
CREATE OR REPLACE FUNCTION public.protect_user_subscriptions_tier()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow service_role (backend/edge functions) to update anything
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Admins can update anything
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  -- Non-admins cannot change tier_id, date_end, or status
  IF NEW.tier_id IS DISTINCT FROM OLD.tier_id THEN
    RAISE EXCEPTION 'Not authorized to change subscription tier';
  END IF;
  
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'Not authorized to change subscription status';
  END IF;

  IF NEW.date_end IS DISTINCT FROM OLD.date_end THEN
    RAISE EXCEPTION 'Not authorized to change subscription end date';
  END IF;

  RETURN NEW;
END;
$$;

-- Also fix protect_subscriptions_tier (legacy table)
CREATE OR REPLACE FUNCTION public.protect_subscriptions_tier()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow service_role (backend/edge functions) to update anything
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Admins can update anything
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  -- Non-admins cannot change tier, status, or current_period_end
  IF NEW.tier IS DISTINCT FROM OLD.tier THEN
    RAISE EXCEPTION 'Not authorized to change subscription tier';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'Not authorized to change subscription status';
  END IF;

  IF NEW.current_period_end IS DISTINCT FROM OLD.current_period_end THEN
    RAISE EXCEPTION 'Not authorized to change subscription end date';
  END IF;

  RETURN NEW;
END;
$$;
