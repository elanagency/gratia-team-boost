-- Add temporary_password column to company_members table
ALTER TABLE public.company_members 
ADD COLUMN temporary_password text;

-- Add comment to explain the column purpose
COMMENT ON COLUMN public.company_members.temporary_password IS 'Stores auto-generated password for users who have not logged in yet. Cleared after first login.';