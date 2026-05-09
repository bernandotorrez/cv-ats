-- =====================================================
-- RLS Gap Documentation for user_subscriptions
-- Created: 2026-05-08
-- Purpose: Document intentional RLS policy gaps
-- =====================================================

-- NOTE: No INSERT/UPDATE/DELETE policies for user_subscriptions table.
-- This is intentional for the following security reasons:
--
-- 1. INSERT is handled exclusively by:
--    - handle_new_user() trigger: Automatically creates free tier subscription for new users
--    - payment-webhook Edge Function: Creates subscription when payment succeeds
--
-- 2. UPDATE is handled exclusively by:
--    - payment-webhook Edge Function: Updates subscription status on payment events
--    - Admin panel (service_role): Manual subscription management by admins
--
-- 3. DELETE is not allowed:
--    - Subscription history should be preserved for audit purposes
--    - Cancelled subscriptions are marked with status='cancelled', not deleted
--
-- Users cannot create/modify/delete their own subscriptions directly through the API.
-- All subscription changes go through the payment workflow for security and consistency.

-- Add comment to table
COMMENT ON TABLE public.user_subscriptions IS 
  'User subscription records. INSERT/UPDATE/DELETE only via Edge Functions and Admin, not directly by users.';

-- Add comments to columns for documentation
COMMENT ON COLUMN public.user_subscriptions.status IS 
  'Subscription status. Managed exclusively by payment-webhook Edge Function.';
COMMENT ON COLUMN public.user_subscriptions.date_end IS 
  'Subscription end date. Extended by payment-webhook on successful payment.';
