-- Add trial tracking fields to companies table
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS trial_mode boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz,
ADD COLUMN IF NOT EXISTS first_active_member_at timestamptz;

-- Add trial tracking to company_members
ALTER TABLE public.company_members
ADD COLUMN IF NOT EXISTS is_trial_user boolean DEFAULT true;