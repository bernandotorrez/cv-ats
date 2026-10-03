-- =====================================================
-- Security: bind Pro Photo (Kie AI) task IDs to their owner (M8)
-- Created: 2026-10-04
--
-- Edge function `pro-photo` mencatat (task_id, user_id) saat membuat task
-- dan hanya mengizinkan pemiliknya mengecek status / mengambil hasil.
-- Tabel hanya diakses service_role (RLS aktif tanpa policy client).
-- =====================================================

CREATE TABLE IF NOT EXISTS public.pro_photo_tasks (
  task_id TEXT PRIMARY KEY CHECK (task_id ~ '^[A-Za-z0-9_-]{8,128}$'),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pro_photo_tasks_user_id_idx ON public.pro_photo_tasks (user_id);

ALTER TABLE public.pro_photo_tasks ENABLE ROW LEVEL SECURITY;

-- Tidak ada policy untuk anon/authenticated; cabut juga grant default tabel.
REVOKE ALL ON TABLE public.pro_photo_tasks FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.pro_photo_tasks TO service_role;
