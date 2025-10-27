-- Allow DELETE operations on reviews, comments, faculty tables for admins
-- First, update RLS policies for reviews to allow admin deletion
CREATE POLICY "Admins can delete reviews"
ON public.reviews
FOR DELETE
USING (
  has_role(auth.uid(), 'admin')
);

-- Add policy to allow admin deletion of comments
CREATE POLICY "Admins can delete comments"
ON public.comments
FOR DELETE
USING (
  has_role(auth.uid(), 'admin')
);

-- Add policy to allow admin deletion of faculty
CREATE POLICY "Admins can delete faculty"
ON public.faculty
FOR DELETE
USING (
  has_role(auth.uid(), 'admin')
);

-- Add policy to allow admins to delete user profiles (for user management)
CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
USING (
  has_role(auth.uid(), 'admin')
);