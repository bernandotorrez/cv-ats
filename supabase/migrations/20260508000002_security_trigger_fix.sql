-- =====================================================
-- Security Hardening: Trigger Function Cleanup
-- Created: 2026-05-08
-- Purpose: Ensure trigger functions follow least-privilege principle
-- =====================================================

-- update_updated_at_column() - does NOT need SECURITY DEFINER
-- This function only sets NEW.updated_at = now(), which is a simple operation
-- that doesn't require elevated privileges. It should run with caller's privileges.
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
-- SECURITY DEFINER intentionally NOT used - not needed for simple timestamp update
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Revoke execute from public if it exists (should already be restricted)
-- This ensures only table triggers can call this function
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC;

-- Grant execute only to authenticated users (for manual testing/debugging)
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO service_role;

COMMENT ON FUNCTION public.update_updated_at_column() IS 
  'Trigger function to auto-update updated_at column. Runs with caller privileges, no SECURITY DEFINER needed.';
