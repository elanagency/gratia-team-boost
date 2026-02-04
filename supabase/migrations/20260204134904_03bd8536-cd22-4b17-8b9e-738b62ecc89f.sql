-- Add region_setup_complete column to companies table
-- This tracks whether the company admin has completed the region selection during onboarding
ALTER TABLE public.companies 
ADD COLUMN region_setup_complete BOOLEAN DEFAULT FALSE;