-- Create faculty_votes table for likes/dislikes on faculty
CREATE TABLE public.faculty_votes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  faculty_id uuid NOT NULL REFERENCES public.faculty(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  vote_type text NOT NULL CHECK (vote_type IN ('like', 'dislike')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(faculty_id, user_id)
);

-- Enable RLS
ALTER TABLE public.faculty_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for faculty_votes
CREATE POLICY "Anyone can view faculty votes"
ON public.faculty_votes FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can add faculty votes"
ON public.faculty_votes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own faculty votes"
ON public.faculty_votes FOR DELETE
USING (auth.uid() = user_id);

-- Create review_votes table for likes/dislikes on reviews
CREATE TABLE public.review_votes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id uuid NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  vote_type text NOT NULL CHECK (vote_type IN ('like', 'dislike')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(review_id, user_id)
);

-- Enable RLS
ALTER TABLE public.review_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for review_votes
CREATE POLICY "Anyone can view review votes"
ON public.review_votes FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can add review votes"
ON public.review_votes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own review votes"
ON public.review_votes FOR DELETE
USING (auth.uid() = user_id);

-- Create blacklist_votes table for blacklist badges on faculty
CREATE TABLE public.blacklist_votes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  faculty_id uuid NOT NULL REFERENCES public.faculty(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(faculty_id, user_id)
);

-- Enable RLS
ALTER TABLE public.blacklist_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for blacklist_votes
CREATE POLICY "Anyone can view blacklist votes"
ON public.blacklist_votes FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can add blacklist votes"
ON public.blacklist_votes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own blacklist votes"
ON public.blacklist_votes FOR DELETE
USING (auth.uid() = user_id);

-- Create function to award points when faculty is added
CREATE OR REPLACE FUNCTION award_faculty_points()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET points = points + 20
  WHERE user_id = NEW.created_by;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for faculty points
CREATE TRIGGER award_faculty_points_trigger
AFTER INSERT ON public.faculty
FOR EACH ROW
EXECUTE FUNCTION award_faculty_points();

-- Create function to award points when review is added
CREATE OR REPLACE FUNCTION award_review_points()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET points = points + 10
  WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for review points
CREATE TRIGGER award_review_points_trigger
AFTER INSERT ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION award_review_points();

-- Create function to award points when comment is added
CREATE OR REPLACE FUNCTION award_comment_points()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET points = points + 5
  WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for comment points
CREATE TRIGGER award_comment_points_trigger
AFTER INSERT ON public.comments
FOR EACH ROW
EXECUTE FUNCTION award_comment_points();

-- Add likes and dislikes columns to faculty table
ALTER TABLE public.faculty 
ADD COLUMN likes integer DEFAULT 0,
ADD COLUMN dislikes integer DEFAULT 0;

-- Add likes and dislikes columns to reviews table
ALTER TABLE public.reviews 
ADD COLUMN likes integer DEFAULT 0,
ADD COLUMN dislikes integer DEFAULT 0;

-- Create function to update faculty vote counts
CREATE OR REPLACE FUNCTION update_faculty_votes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote_type = 'like' THEN
      UPDATE public.faculty SET likes = likes + 1 WHERE id = NEW.faculty_id;
    ELSE
      UPDATE public.faculty SET dislikes = dislikes + 1 WHERE id = NEW.faculty_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote_type = 'like' THEN
      UPDATE public.faculty SET likes = likes - 1 WHERE id = OLD.faculty_id;
    ELSE
      UPDATE public.faculty SET dislikes = dislikes - 1 WHERE id = OLD.faculty_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for faculty votes
CREATE TRIGGER update_faculty_votes_trigger
AFTER INSERT OR DELETE ON public.faculty_votes
FOR EACH ROW
EXECUTE FUNCTION update_faculty_votes();

-- Create function to update review vote counts
CREATE OR REPLACE FUNCTION update_review_votes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote_type = 'like' THEN
      UPDATE public.reviews SET likes = likes + 1 WHERE id = NEW.review_id;
    ELSE
      UPDATE public.reviews SET dislikes = dislikes + 1 WHERE id = NEW.review_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote_type = 'like' THEN
      UPDATE public.reviews SET likes = likes - 1 WHERE id = OLD.review_id;
    ELSE
      UPDATE public.reviews SET dislikes = dislikes - 1 WHERE id = OLD.review_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for review votes
CREATE TRIGGER update_review_votes_trigger
AFTER INSERT OR DELETE ON public.review_votes
FOR EACH ROW
EXECUTE FUNCTION update_review_votes();