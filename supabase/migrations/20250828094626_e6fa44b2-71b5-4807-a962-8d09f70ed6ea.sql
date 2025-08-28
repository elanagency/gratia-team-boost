-- Add department column to company_members table
ALTER TABLE public.company_members 
ADD COLUMN department text;