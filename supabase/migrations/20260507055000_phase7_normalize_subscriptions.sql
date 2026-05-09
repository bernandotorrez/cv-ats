-- Phase 7: Normalize subscription schema
-- Master table for subscription tiers + user subscriptions with date range

-- 1. Create master tier table
CREATE TABLE public.subscription_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  price_monthly INTEGER NOT NULL DEFAULT 0,
  price_yearly INTEGER,
  -- quotas (NULL = unlimited)
  max_cvs INTEGER DEFAULT 1,
  quota_ai_suggest INTEGER DEFAULT 0,
  quota_ai_score INTEGER DEFAULT 0,
  quota_ai_chat INTEGER DEFAULT 0,
  quota_ai_cover_letter INTEGER DEFAULT 0,
  quota_ai_keyword_extract INTEGER DEFAULT 0,
  -- template access
  template_access TEXT NOT NULL DEFAULT 'basic' CHECK (template_access IN ('basic', 'all')),
  -- features list (for display)
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed tier data
INSERT INTO public.subscription_tiers (slug, name, description, price_monthly, price_yearly, max_cvs, quota_ai_suggest, quota_ai_score, quota_ai_chat, quota_ai_cover_letter, quota_ai_keyword_extract, template_access, features, sort_order) VALUES
  ('free', 'Free', 'Paket gratis selamanya untuk mulai membuat CV ATS.', 0, NULL,
   1, 5, 1, 5, 1, 2,
   'basic',
   '["1 CV aktif", "5 AI Saran/bulan", "1 AI Scoring/bulan", "2 Template Basic", "5 AI Chat/bulan", "1 Cover Letter/bulan", "Export PDF", "ATS Friendly Check"]'::jsonb,
   1),
  ('starter', 'Starter', 'Untuk job seeker serius yang butuh lebih banyak CV & AI.', 19000, 150000,
   3, 50, 10, 50, 10, 20,
   'all',
   '["3 CV aktif", "50 AI Saran/bulan", "10 AI Scoring/bulan", "Semua Template", "50 AI Chat/bulan", "10 Cover Letter/bulan", "Export PDF tanpa watermark", "ATS Friendly Check", "Keyword Extractor", "LinkedIn Import"]'::jsonb,
   2),
  ('pro', 'Pro', 'Untuk profesional yang ingin CV terbaik dan prioritas.', 49000, 400000,
   NULL, NULL, NULL, NULL, NULL, NULL,
   'all',
   '["CV Unlimited", "AI Unlimited", "Semua Template Premium", "AI Chat Unlimited", "Cover Letter Unlimited", "Export PDF tanpa watermark", "ATS Friendly Check", "Keyword Extractor", "LinkedIn Import", "Prioritas Support", "CV Version History"]'::jsonb,
   3);

ALTER TABLE public.subscription_tiers ENABLE ROW LEVEL SECURITY;

-- Anyone can view active tiers
CREATE POLICY "Anyone can view tiers" ON public.subscription_tiers
  FOR SELECT USING (is_active = true);

-- 2. Create user subscriptions table
CREATE TYPE public.subscription_status_new AS ENUM ('active', 'cancelled', 'expired', 'past_due', 'trial');

CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier_id UUID NOT NULL REFERENCES public.subscription_tiers(id),
  status subscription_status_new NOT NULL DEFAULT 'active',
  date_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  date_end TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '1 month'),
  auto_renew BOOLEAN NOT NULL DEFAULT false,
  provider TEXT,           -- 'midtrans' / 'xendit' / 'manual'
  external_id TEXT,        -- payment reference / order_id
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One active subscription per user at a time (enforced by app logic, not unique constraint
-- because user may have history). We use a partial unique index for active only.
CREATE UNIQUE INDEX idx_user_subscriptions_active ON public.user_subscriptions(user_id) WHERE status = 'active';

CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_tier_id ON public.user_subscriptions(tier_id);

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own subscriptions" ON public.user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- updated_at trigger
CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Update handle_new_user() to create user_subscriptions instead
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  free_tier_id UUID;
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  -- Get free tier ID
  SELECT id INTO free_tier_id FROM public.subscription_tiers WHERE slug = 'free' LIMIT 1;

  IF free_tier_id IS NOT NULL THEN
    INSERT INTO public.user_subscriptions (user_id, tier_id, status, date_start, date_end)
    VALUES (NEW.id, free_tier_id, 'active', now(), (now() + interval '100 years'));
    -- Free tier: set end date far in future (effectively unlimited)
  END IF;

  RETURN NEW;
END;
$$;

-- 4. Migrate existing subscriptions to new table (if any data exists)
DO $$
DECLARE
  free_id UUID;
  starter_id UUID;
  pro_id UUID;
  sub RECORD;
BEGIN
  SELECT id INTO free_id FROM public.subscription_tiers WHERE slug = 'free';
  SELECT id INTO starter_id FROM public.subscription_tiers WHERE slug = 'starter';
  SELECT id INTO pro_id FROM public.subscription_tiers WHERE slug = 'pro';

  -- Only migrate if old subscriptions table exists and has data
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptions' AND table_schema = 'public') THEN
    FOR sub IN SELECT * FROM public.subscriptions LOOP
      -- Skip if user already has an active subscription in new table
      IF NOT EXISTS (SELECT 1 FROM public.user_subscriptions WHERE user_id = sub.user_id AND status = 'active') THEN
        INSERT INTO public.user_subscriptions (user_id, tier_id, status, date_start, date_end, provider, external_id)
        VALUES (
          sub.user_id,
          CASE sub.tier
            WHEN 'free' THEN free_id
            WHEN 'starter' THEN starter_id
            WHEN 'pro' THEN pro_id
            ELSE free_id
          END,
          CASE sub.status::text
            WHEN 'active' THEN 'active'::subscription_status_new
            WHEN 'cancelled' THEN 'cancelled'::subscription_status_new
            WHEN 'expired' THEN 'expired'::subscription_status_new
            WHEN 'past_due' THEN 'past_due'::subscription_status_new
            ELSE 'active'::subscription_status_new
          END,
          sub.current_period_start,
          sub.current_period_end,
          sub.provider,
          sub.external_id
        );
      END IF;
    END LOOP;
  END IF;
END;
$$;
