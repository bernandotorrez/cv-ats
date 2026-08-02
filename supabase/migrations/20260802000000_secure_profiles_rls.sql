-- Create a trigger function to protect sensitive quota and subscription columns in profiles
CREATE OR REPLACE FUNCTION public.protect_profile_quotas()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow admins to update any column
  IF public.has_role(auth.uid(), 'admin') THEN
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

-- Drop trigger if exists to allow re-running this migration safely
DROP TRIGGER IF EXISTS protect_profile_quotas_trigger ON public.profiles;

-- Create the trigger on the profiles table
CREATE TRIGGER protect_profile_quotas_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_quotas();
