-- =====================================================
-- Security: Secure RPC Functions
-- Created: 2026-05-12
-- Purpose: Add input validation to RPC functions
-- Note: Uses CREATE OR REPLACE to avoid breaking RLS policy dependencies
-- =====================================================

-- ─── Secure has_role function ───────────────────────────────────────
-- Using CREATE OR REPLACE to maintain RLS policy dependencies
CREATE OR REPLACE FUNCTION public.has_role(
  _user_id UUID,
  _role TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  has_role BOOLEAN;
  clean_user_id UUID;
  clean_role TEXT;
BEGIN
  -- Validate inputs are not null
  IF _user_id IS NULL OR _role IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Validate UUID format (defense in depth)
  IF NOT (_user_id::TEXT ~ '^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$') THEN
    RAISE WARNING 'Invalid user_id format in has_role';
    RETURN FALSE;
  END IF;
  
  -- Validate role format (alphanumeric and underscores only)
  IF NOT (_role ~ '^[a-z_]+$') THEN
    RAISE WARNING 'Invalid role format in has_role: %', _role;
    RETURN FALSE;
  END IF;
  
  -- Cast to ensure proper type
  clean_user_id := _user_id::UUID;
  clean_role := lower(_role);
  
  -- Check role
  SELECT EXISTS(
    SELECT 1 FROM user_roles 
    WHERE user_id = clean_user_id 
    AND role = clean_role
    AND (expires_at IS NULL OR expires_at > NOW())
  ) INTO has_role;
  
  RETURN COALESCE(has_role, FALSE);
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.has_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, text) TO service_role;

-- ─── Secure track_referral_signup function ──────────────────────────
-- Using CREATE OR REPLACE if function exists
CREATE OR REPLACE FUNCTION public.track_referral_signup(
  p_code TEXT,
  p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  referrer_id UUID;
  clean_code TEXT;
  clean_user_id UUID;
BEGIN
  -- Validate inputs
  IF p_code IS NULL OR p_user_id IS NULL THEN
    RAISE EXCEPTION 'Missing required parameters';
  END IF;
  
  -- Validate referral code format (alphanumeric, 6-20 chars)
  IF NOT (p_code ~ '^[a-zA-Z0-9_-]{6,20}$') THEN
    RAISE EXCEPTION 'Invalid referral code format';
  END IF;
  
  -- Validate UUID format
  IF NOT (p_user_id::TEXT ~ '^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$') THEN
    RAISE EXCEPTION 'Invalid user ID format';
  END IF;
  
  clean_code := upper(p_code);
  clean_user_id := p_user_id::UUID;
  
  -- Check if code exists and is valid
  IF NOT EXISTS (
    SELECT 1 FROM referral_codes 
    WHERE code = clean_code 
    AND (used = false OR used IS NULL)
    AND (expires_at IS NULL OR expires_at > NOW())
    AND max_uses > (SELECT COUNT(*) FROM referral_signups WHERE code = clean_code)
  ) THEN
    RAISE EXCEPTION 'Invalid or expired referral code';
  END IF;
  
  -- Get referrer ID
  SELECT user_id INTO referrer_id
  FROM referral_codes
  WHERE code = clean_code;
  
  -- Check if user already referred
  IF EXISTS (
    SELECT 1 FROM referral_signups 
    WHERE referred_id = clean_user_id
  ) THEN
    RAISE EXCEPTION 'User already referred';
  END IF;
  
  -- Insert referral signup
  INSERT INTO referral_signups (referrer_id, referred_id, code, created_at)
  VALUES (referrer_id, clean_user_id, clean_code, NOW())
  ON CONFLICT DO NOTHING;
  
  -- Mark code as used (if single-use)
  UPDATE referral_codes 
  SET used = true 
  WHERE code = clean_code 
  AND max_uses = 1;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't expose details to client
    RAISE WARNING 'Referral tracking failed: %', SQLSTATE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.track_referral_signup(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.track_referral_signup(text, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.track_referral_signup(text, uuid) TO service_role;

-- ─── Create referral_signups table if not exists ───────────────────
CREATE TABLE IF NOT EXISTS public.referral_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  referred_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  code TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(referred_id) -- Each user can only be referred once
);

CREATE INDEX IF NOT EXISTS idx_referral_signups_referrer ON public.referral_signups(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_signups_referred ON public.referral_signups(referred_id);

-- ─── Create referral_codes table if not exists ─────────────────────
CREATE TABLE IF NOT EXISTS public.referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  code TEXT UNIQUE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ,
  max_uses INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON public.referral_codes(code);

-- ─── Enable RLS on referral tables ─────────────────────────────────
ALTER TABLE public.referral_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

-- Referral signups: anyone can insert, only service can view
CREATE POLICY "Anyone can create referral signup" ON public.referral_signups
  FOR INSERT TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Service can view referral signups" ON public.referral_signups
  FOR SELECT TO service_role
  USING (true);

-- Referral codes: anyone can view (for validation), only service can modify
CREATE POLICY "Anyone can view referral codes" ON public.referral_codes
  FOR SELECT TO authenticated, anon
  USING (true);

CREATE POLICY "Service can manage referral codes" ON public.referral_codes
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON FUNCTION public.has_role IS 'Securely check if user has a specific role with input validation';
COMMENT ON FUNCTION public.track_referral_signup IS 'Track referral signup with validation and anti-fraud measures';
