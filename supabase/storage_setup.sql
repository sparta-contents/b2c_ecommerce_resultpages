-- Storage setup for post images

-- 1. Create storage bucket for post images (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-images', 'post-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Enable RLS for storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies (if any)
DROP POLICY IF EXISTS "Anyone can view post images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload post images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own post images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own post images" ON storage.objects;

-- 4. Create policies for public read access
CREATE POLICY "Anyone can view post images"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-images');

-- 5. Create policies for authenticated users to upload
CREATE POLICY "Authenticated users can upload post images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'post-images'
  AND auth.role() = 'authenticated'
);

-- 6. Create policies for users to update their own images
CREATE POLICY "Users can update their own post images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'post-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'post-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 7. Create policies for users to delete their own images
CREATE POLICY "Users can delete their own post images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'post-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
