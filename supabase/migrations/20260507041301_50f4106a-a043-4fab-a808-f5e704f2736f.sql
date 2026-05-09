CREATE TABLE public.cvs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'CV Saya',
  template_id TEXT NOT NULL DEFAULT 'jakarta',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cvs_user_id ON public.cvs(user_id);

ALTER TABLE public.cvs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own cvs" ON public.cvs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own cvs" ON public.cvs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own cvs" ON public.cvs
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own cvs" ON public.cvs
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_cvs_updated_at
  BEFORE UPDATE ON public.cvs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();