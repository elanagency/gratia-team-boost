-- Add stripe_environment column to companies table
ALTER TABLE public.companies 
ADD COLUMN stripe_environment TEXT NOT NULL DEFAULT 'test';

-- Add check constraint to ensure valid values
ALTER TABLE public.companies 
ADD CONSTRAINT stripe_environment_check 
CHECK (stripe_environment IN ('test', 'live'));

-- Set existing companies to current global environment mode (migration)
-- This will be set to 'test' by default, platform admins can change as needed

-- Add comment for clarity
COMMENT ON COLUMN public.companies.stripe_environment IS 'Stripe environment for this company: test or live';