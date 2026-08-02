-- Security fix: Ensure ONLY admins can update the tier on user_subscriptions and subscriptions

-- Trigger for user_subscriptions (Phase 7 table)
CREATE OR REPLACE FUNCTION public.protect_user_subscriptions_tier()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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

DROP TRIGGER IF EXISTS protect_user_subscriptions_tier_trigger ON public.user_subscriptions;
CREATE TRIGGER protect_user_subscriptions_tier_trigger
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_user_subscriptions_tier();


-- Trigger for subscriptions (Legacy table)
CREATE OR REPLACE FUNCTION public.protect_subscriptions_tier()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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

DROP TRIGGER IF EXISTS protect_subscriptions_tier_trigger ON public.subscriptions;
CREATE TRIGGER protect_subscriptions_tier_trigger
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_subscriptions_tier();
