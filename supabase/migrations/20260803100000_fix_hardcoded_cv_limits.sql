-- Security fix: Read CV limits from subscription_tiers table instead of hardcoding
-- Prevents drift between subscription_tiers.max_cvs and actual enforced limits.

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

  -- Get user tier AND max_cvs from subscription_tiers (single query, no hardcoding)
  SELECT st.slug, COALESCE(st.max_cvs, 1) INTO v_tier_slug, v_max_cvs
  FROM public.user_subscriptions us
  JOIN public.subscription_tiers st ON us.tier_id = st.id
  WHERE us.user_id = NEW.user_id AND us.status = 'active'
  ORDER BY us.created_at DESC
  LIMIT 1;

  -- Default to free tier limits if no active subscription
  IF v_tier_slug IS NULL THEN
    SELECT COALESCE(st.max_cvs, 1) INTO v_max_cvs
    FROM public.subscription_tiers st
    WHERE st.slug = 'free'
    LIMIT 1;

    IF v_max_cvs IS NULL THEN
      v_max_cvs := 1;
    END IF;
  END IF;

  IF v_cv_count >= v_max_cvs THEN
    RAISE EXCEPTION 'Batas pembuatan CV tercapai (maksimum % CV). Silakan upgrade paket Anda.', v_max_cvs;
  END IF;

  RETURN NEW;
END;
$$;
