-- Latihan negosiasi gaji (simulasi HR). Diakses HANYA lewat edge function `ai-interview`
-- (service role): kolom `persona` berisi batas atas gaji rahasia HR, jadi tidak boleh terbaca
-- langsung oleh client — itulah sebabnya tidak ada policy untuk anon/authenticated.
CREATE TABLE IF NOT EXISTS public.negotiation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  position TEXT NOT NULL,
  level TEXT NOT NULL,
  industry TEXT,
  city TEXT,
  current_salary BIGINT,
  expected_salary BIGINT NOT NULL CHECK (expected_salary > 0),
  persona JSONB NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  current_offer BIGINT NOT NULL,
  turn_count INTEGER NOT NULL DEFAULT 0 CHECK (turn_count >= 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended', 'evaluated')),
  result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_negotiation_sessions_user_created
  ON public.negotiation_sessions (user_id, created_at DESC);

ALTER TABLE public.negotiation_sessions ENABLE ROW LEVEL SECURITY;

-- Tanpa policy + tanpa grant: hanya service role (edge function) yang bisa membaca/menulis.
REVOKE ALL ON TABLE public.negotiation_sessions FROM anon, authenticated;
