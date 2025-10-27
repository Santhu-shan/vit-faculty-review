-- Drop the existing foreign key to auth.users
ALTER TABLE public.reviews
DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;

-- Create foreign key from reviews.user_id to profiles.user_id
ALTER TABLE public.reviews
ADD CONSTRAINT reviews_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.profiles(user_id)
ON DELETE CASCADE;

-- Create foreign key from comments.user_id to profiles.user_id
ALTER TABLE public.comments
ADD CONSTRAINT comments_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.profiles(user_id)
ON DELETE CASCADE;