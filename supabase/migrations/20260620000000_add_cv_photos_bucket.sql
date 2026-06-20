-- Create cv-photos storage bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cv-photos',
  'cv-photos',
  false,
  2097152, -- 2MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security (RLS) for storage objects if not already enabled (usually is, but good practice)
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist (to support re-running/idempotency if needed)
DROP POLICY IF EXISTS "Allow users to read their own cv-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to upload their own cv-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own cv-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own cv-photos" ON storage.objects;

-- RLS Policies: User folders structure: cv-photos/{user_id}/{cv_id}.{ext}
-- We extract user_id from the folder path: (storage.foldername(name))[1]

-- 1. SELECT: Users can only read their own photos
CREATE POLICY "Allow users to read their own cv-photos" ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'cv-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 2. INSERT: Users can only upload to their own folder
CREATE POLICY "Allow users to upload their own cv-photos" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'cv-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 3. UPDATE: Users can only update their own photos in their own folder
CREATE POLICY "Allow users to update their own cv-photos" ON storage.objects
  FOR UPDATE
  TO authenticated
  WITH CHECK (bucket_id = 'cv-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 4. DELETE: Users can only delete their own photos
CREATE POLICY "Allow users to delete their own cv-photos" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'cv-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
