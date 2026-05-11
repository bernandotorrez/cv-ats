-- Fix has_role function completely
-- Drop all policies that depend on has_role first
DROP POLICY IF EXISTS "Admins view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage job listings" ON public.job_listings;
DROP POLICY IF EXISTS "Anyone can view active job listings" ON public.job_listings;

-- Drop existing has_role functions (must use same parameter names)
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role);
DROP FUNCTION IF EXISTS public.has_role(uuid, text);

-- Create has_role with TEXT parameter (same param names as original)
CREATE FUNCTION public.has_role(_user_id UUID, _role TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role::TEXT = _role
  );
END;
$$;

-- Grant execute
GRANT EXECUTE ON FUNCTION public.has_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, text) TO PUBLIC;

-- Recreate policies
CREATE POLICY "Admins view all roles" ON public.user_roles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view active job listings" ON public.job_listings
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage job listings" ON public.job_listings
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
