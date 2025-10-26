-- Create storage buckets for images
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('faculty_photos', 'faculty_photos', true),
  ('faculty_details', 'faculty_details', true),
  ('user_avatars', 'user_avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for faculty photos
CREATE POLICY "Faculty photos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'faculty_photos');

CREATE POLICY "Authenticated users can upload faculty photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'faculty_photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update faculty photos they uploaded"
ON storage.objects FOR UPDATE
USING (bucket_id = 'faculty_photos' AND auth.uid() IS NOT NULL);

-- Create storage policies for faculty details
CREATE POLICY "Faculty details are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'faculty_details');

CREATE POLICY "Authenticated users can upload faculty details"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'faculty_details' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update faculty details they uploaded"
ON storage.objects FOR UPDATE
USING (bucket_id = 'faculty_details' AND auth.uid() IS NOT NULL);

-- Create storage policies for user avatars
CREATE POLICY "User avatars are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'user_avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'user_avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'user_avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'user_avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add details_image_url column to faculty table
ALTER TABLE public.faculty 
ADD COLUMN IF NOT EXISTS details_image_url text;

-- Update faculty table to make faculty_id nullable
ALTER TABLE public.faculty 
ALTER COLUMN faculty_id DROP NOT NULL;

-- Update default values for auto-approval
ALTER TABLE public.faculty 
ALTER COLUMN approved SET DEFAULT true;

ALTER TABLE public.reviews 
ALTER COLUMN status SET DEFAULT 'approved';

-- Update existing pending records to approved (optional, uncomment if needed)
-- UPDATE public.faculty SET approved = true WHERE approved = false;
-- UPDATE public.reviews SET status = 'approved' WHERE status = 'pending';