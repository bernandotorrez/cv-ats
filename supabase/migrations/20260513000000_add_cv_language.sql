ALTER TABLE public.cvs ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'id' CHECK (language IN ('id', 'en'));
