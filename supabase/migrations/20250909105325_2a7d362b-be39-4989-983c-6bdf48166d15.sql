-- Rename stripe_environment column to environment and update default to 'live'
ALTER TABLE public.companies 
RENAME COLUMN stripe_environment TO environment;

-- Drop the old constraint
ALTER TABLE public.companies 
DROP CONSTRAINT IF EXISTS stripe_environment_check;

-- Add new constraint with updated name and values
ALTER TABLE public.companies 
ADD CONSTRAINT environment_check CHECK (environment IN ('test', 'live'));

-- Update the default value to 'live'
ALTER TABLE public.companies 
ALTER COLUMN environment SET DEFAULT 'live';