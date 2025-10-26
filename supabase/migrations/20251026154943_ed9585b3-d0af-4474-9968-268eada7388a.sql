-- Security fix: Restrict profiles table access to authenticated users only
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles"
ON public.profiles FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Security fix: Restrict comment votes to authenticated users
DROP POLICY IF EXISTS "Anyone can view votes" ON public.comment_votes;

CREATE POLICY "Authenticated users can view votes"
ON public.comment_votes FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Security fix: Create view for anonymous reviews that masks user_id
CREATE OR REPLACE VIEW public.reviews_public AS
SELECT 
  id,
  CASE WHEN is_anonymous THEN NULL ELSE user_id END as user_id,
  faculty_id,
  content,
  teaching_quality,
  approachability,
  clarity,
  availability,
  fairness,
  is_anonymous,
  status,
  created_at,
  updated_at
FROM public.reviews
WHERE status = 'approved';

-- Grant access to the view
GRANT SELECT ON public.reviews_public TO authenticated;
GRANT SELECT ON public.reviews_public TO anon;