-- Create faculty_stars table to track user-starred "top faculty"
CREATE TABLE public.faculty_stars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id uuid NOT NULL REFERENCES public.faculty(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(faculty_id, user_id)
);

-- Enable RLS
ALTER TABLE public.faculty_stars ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view faculty stars"
ON public.faculty_stars
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can star faculty"
ON public.faculty_stars
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unstar their own stars"
ON public.faculty_stars
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_faculty_stars_faculty_id ON public.faculty_stars(faculty_id);
CREATE INDEX idx_faculty_stars_user_id ON public.faculty_stars(user_id);

-- Add policy to allow any authenticated user to update courses_taught
CREATE POLICY "Authenticated users can update courses taught"
ON public.faculty
FOR UPDATE
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);