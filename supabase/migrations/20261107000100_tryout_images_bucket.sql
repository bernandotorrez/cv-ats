-- ─────────────────────────────────────────────────────────────────────────────
-- Bucket gambar soal tryout (TIU figural & gambar soal/opsi manual)
--
-- * Public read: gambar ditampilkan saat ujian lewat <img>. Path memakai UUID
--   acak (figural/<set>/<uuid>/A.svg), jadi URL hanya diketahui dari data
--   soal yang sudah dilindungi RLS / edge function.
-- * Tulis/ubah/hapus HANYA admin (user_roles.role = 'admin').
-- * Dibatasi 1 MB dan tipe gambar. SVG hanya dibuat oleh generator internal
--   (upload manual dari admin dibatasi PNG/JPEG/WebP di client).
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tryout-images',
  'tryout-images',
  true,
  1048576,
  ARRAY['image/svg+xml', 'image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Admins can read tryout images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload tryout images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update tryout images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete tryout images" ON storage.objects;

-- API storage butuh izin SELECT untuk menghapus/menimpa objek (bucket publik
-- tetap bisa diunduh siapa pun lewat URL publik tanpa policy ini).
CREATE POLICY "Admins can read tryout images" ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'tryout-images'
    AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  );

CREATE POLICY "Admins can upload tryout images" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'tryout-images'
    AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  );

CREATE POLICY "Admins can update tryout images" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'tryout-images'
    AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  )
  WITH CHECK (
    bucket_id = 'tryout-images'
    AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  );

CREATE POLICY "Admins can delete tryout images" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'tryout-images'
    AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  );

-- Gambar soal juga bagian dari isi soal: perubahan gambar ikut mereset
-- pembahasan detail (sama seperti teks/opsi/kunci/skor).
CREATE OR REPLACE FUNCTION public.tryout_questions_invalidate_detail()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF (NEW.question_text IS DISTINCT FROM OLD.question_text
      OR NEW.question_image_url IS DISTINCT FROM OLD.question_image_url
      OR NEW.options IS DISTINCT FROM OLD.options
      OR NEW.correct_answer IS DISTINCT FROM OLD.correct_answer
      OR NEW.scores IS DISTINCT FROM OLD.scores)
     AND NEW.explanation_detail IS NOT DISTINCT FROM OLD.explanation_detail THEN
    NEW.explanation_detail := NULL;
    NEW.explanation_detail_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;
