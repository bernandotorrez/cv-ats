-- Security fix: Remove user INSERT policy on ai_usage table
-- Users should not be able to directly insert AI usage records.
-- All AI usage tracking MUST go through edge functions (which use service_role).

-- Drop the user-facing INSERT policy
DROP POLICY IF EXISTS "Users insert own ai_usage" ON public.ai_usage;

-- Ensure only service_role can insert (which is the default if no policy exists)
-- The SELECT policy remains so users can view their own usage for transparency:
-- CREATE POLICY "Users view own ai_usage" ON public.ai_usage
--   FOR SELECT USING (auth.uid() = user_id);
