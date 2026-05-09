-- Phase 4: AI Features tables

-- AI usage tracking for quota enforcement
CREATE TABLE public.ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature TEXT NOT NULL CHECK (feature IN ('suggest','score','chat','cover_letter','keyword_extract')),
  tokens_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_usage_user_id ON public.ai_usage(user_id);
CREATE INDEX idx_ai_usage_user_feature_date ON public.ai_usage(user_id, feature, created_at);

ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own ai_usage" ON public.ai_usage
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own ai_usage" ON public.ai_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- CV scoring results
CREATE TABLE public.cv_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cv_id UUID NOT NULL REFERENCES public.cvs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
  suggestions JSONB NOT NULL DEFAULT '[]'::jsonb,
  job_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cv_scores_cv_id ON public.cv_scores(cv_id);
CREATE INDEX idx_cv_scores_user_id ON public.cv_scores(user_id);

ALTER TABLE public.cv_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own cv_scores" ON public.cv_scores
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own cv_scores" ON public.cv_scores
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- CV versions for history/undo
CREATE TABLE public.cv_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cv_id UUID NOT NULL REFERENCES public.cvs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cv_versions_cv_id ON public.cv_versions(cv_id);

ALTER TABLE public.cv_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own cv_versions" ON public.cv_versions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own cv_versions" ON public.cv_versions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
