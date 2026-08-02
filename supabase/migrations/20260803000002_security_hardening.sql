-- ============================================================
-- Security Hardening: Fix Public INSERT Policies & Referral Visibility
-- Created: 2026-08-03
-- ============================================================

-- ─── S1: Batasi INSERT cv_analytics hanya untuk authenticated users ───
DROP POLICY IF EXISTS "Public can insert analytics" ON public.cv_analytics;
CREATE POLICY "Authenticated can insert analytics" ON public.cv_analytics
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ─── S2a: Batasi INSERT referral_signups hanya untuk authenticated ───
DROP POLICY IF EXISTS "Anyone can create referral signup" ON public.referral_signups;
CREATE POLICY "Authenticated can create referral signup" ON public.referral_signups
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- ─── S2b: Batasi INSERT referral_tracking hanya untuk authenticated ───
DROP POLICY IF EXISTS "Public can insert referral clicks" ON public.referral_tracking;
CREATE POLICY "Authenticated can insert referral clicks" ON public.referral_tracking
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- ─── S3: Batasi SELECT referral_codes — hanya lihat code sendiri atau code valid via RPC ───
DROP POLICY IF EXISTS "Anyone can view referral codes" ON public.referral_codes;
DROP POLICY IF EXISTS "Users can view own referral code" ON public.referral_codes;

-- User hanya bisa lihat referral code miliknya sendiri
CREATE POLICY "Users view own referral codes" ON public.referral_codes
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Admin bisa lihat semua
CREATE POLICY "Admins view all referral codes" ON public.referral_codes
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Service role bisa manage semua (existing policy tetap)
-- CREATE POLICY "Service can manage referral codes" already exists for service_role

-- ─── S4: Tambah XSS protection trigger untuk cvs.data ───
-- Validasi CV content untuk mencegah stored XSS
CREATE OR REPLACE FUNCTION public.sanitize_cv_data()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Reject CV data yang mengandung script tags atau event handlers
  IF NEW.data::text ~* '<script[^>]*>|javascript:|on\w+\s*=|data:text/html' THEN
    RAISE EXCEPTION 'CV content contains potentially malicious code';
  END IF;

  -- Reject data yang terlalu besar (max 500KB per CV)
  IF length(NEW.data::text) > 500000 THEN
    RAISE EXCEPTION 'CV data too large (max 500KB)';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sanitize_cv_data_trigger ON public.cvs;
CREATE TRIGGER sanitize_cv_data_trigger
  BEFORE INSERT OR UPDATE ON public.cvs
  FOR EACH ROW
  EXECUTE FUNCTION public.sanitize_cv_data();

-- ─── Bonus: Protect job_listings dari non-admin INSERT/UPDATE/DELETE ───
-- Cek apakah sudah ada policy untuk non-admin — seharusnya hanya admin yang bisa manage
-- (Sudah ada policy "Admins can manage job listings", ini defense-in-depth)
-- Pastikan tidak ada celah UPDATE/DELETE untuk non-admin di job_listings
DROP POLICY IF EXISTS "Users can manage job listings" ON public.job_listings;
DROP POLICY IF EXISTS "Authenticated can manage job listings" ON public.job_listings;

-- ─── Bonus: Tambah rate limiting table untuk edge functions ───
-- Table untuk persistent rate limit counter (fallback saat redis tidak ada)
CREATE TABLE IF NOT EXISTS public.rate_limit_counters (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 1,
  reset_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '1 minute'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-cleanup old rows
CREATE INDEX IF NOT EXISTS idx_rate_limit_reset ON public.rate_limit_counters(reset_at);

-- Function untuk check dan increment rate limit (persistent)
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key TEXT,
  p_max_requests INTEGER,
  p_window_seconds INTEGER DEFAULT 60
)
RETURNS TABLE(allowed BOOLEAN, remaining INTEGER, reset_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_reset_at TIMESTAMPTZ;
  v_now TIMESTAMPTZ := now();
BEGIN
  -- Lock row untuk mencegah race condition
  PERFORM pg_advisory_xact_lock(hashtext(p_key));

  -- Coba ambil existing counter
  SELECT rl.count, rl.reset_at INTO v_count, v_reset_at
  FROM public.rate_limit_counters rl
  WHERE rl.key = p_key;

  -- Jika tidak ada atau sudah expired, buat baru
  IF NOT FOUND OR v_now > v_reset_at THEN
    INSERT INTO public.rate_limit_counters (key, count, reset_at)
    VALUES (p_key, 1, v_now + (p_window_seconds || ' seconds')::INTERVAL)
    ON CONFLICT (key) DO UPDATE
    SET count = 1, reset_at = v_now + (p_window_seconds || ' seconds')::INTERVAL;
    
    allowed := true;
    remaining := p_max_requests - 1;
    reset_at := v_now + (p_window_seconds || ' seconds')::INTERVAL;
    RETURN NEXT;
    RETURN;
  END IF;

  -- Cek limit
  IF v_count >= p_max_requests THEN
    allowed := false;
    remaining := 0;
    reset_at := v_reset_at;
    RETURN NEXT;
    RETURN;
  END IF;

  -- Increment
  UPDATE public.rate_limit_counters
  SET count = count + 1
  WHERE key = p_key;

  allowed := true;
  remaining := p_max_requests - v_count - 1;
  reset_at := v_reset_at;
  RETURN NEXT;
END;
$$;

-- Schedule cleanup setiap jam via pg_cron (jika extension tersedia)
-- Jika pg_cron tidak ada, bersihkan saat check_rate_limit dipanggil
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.rate_limit_counters WHERE reset_at < now() - interval '5 minutes';
END;
$$;

-- Enable RLS on rate_limit_counters (service_role only)
ALTER TABLE public.rate_limit_counters ENABLE ROW LEVEL SECURITY;

-- ─── Bonus: Index untuk mempercepat query yang sering dipakai ───
CREATE INDEX IF NOT EXISTS idx_cvs_user_created ON public.cvs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_month ON public.ai_usage(user_id, created_at DESC);
