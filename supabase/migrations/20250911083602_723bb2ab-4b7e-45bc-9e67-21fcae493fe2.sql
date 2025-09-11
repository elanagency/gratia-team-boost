-- Fix security issue: Restrict point allocation insertions to authorized users only
-- The current policy allows anyone to insert allocation records with "true" condition

-- Drop the overly permissive insert policy
DROP POLICY IF EXISTS "System can insert allocations" ON public.monthly_points_allocations;

-- Create restrictive insert policy - only platform admins can manually insert allocations
CREATE POLICY "Platform admins can insert allocations"
ON public.monthly_points_allocations
FOR INSERT
WITH CHECK (is_platform_admin_with_company_check());

-- Note: The allocate_monthly_points() function is SECURITY DEFINER and will bypass RLS
-- when called by authorized edge functions, so automated allocations will still work