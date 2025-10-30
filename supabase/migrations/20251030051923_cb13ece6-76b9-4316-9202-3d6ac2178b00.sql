-- Create questions table
CREATE TABLE public.questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  faculty_id UUID REFERENCES public.faculty(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create answers table
CREATE TABLE public.answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for questions
CREATE POLICY "Anyone can view questions"
ON public.questions FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create questions"
ON public.questions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own questions"
ON public.questions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own questions"
ON public.questions FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for answers
CREATE POLICY "Anyone can view answers"
ON public.answers FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create answers"
ON public.answers FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own answers"
ON public.answers FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own answers"
ON public.answers FOR DELETE
USING (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_questions_updated_at
BEFORE UPDATE ON public.questions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_answers_updated_at
BEFORE UPDATE ON public.answers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();