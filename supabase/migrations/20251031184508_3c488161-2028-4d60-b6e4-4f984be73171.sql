-- Add unique constraint to faculty contact_email to prevent duplicates
ALTER TABLE public.faculty 
ADD CONSTRAINT faculty_contact_email_unique UNIQUE (contact_email);