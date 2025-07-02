
-- Update the default value for existing companies table
ALTER TABLE public.companies 
ALTER COLUMN team_member_monthly_limit SET DEFAULT 100;

-- Update existing companies that have 0 limit to 100
UPDATE public.companies 
SET team_member_monthly_limit = 100 
WHERE team_member_monthly_limit = 0;
