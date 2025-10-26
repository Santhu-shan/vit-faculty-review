-- Drop the security definer view as it's not needed
-- We can query reviews directly with proper RLS policies
DROP VIEW IF EXISTS public.reviews_public;