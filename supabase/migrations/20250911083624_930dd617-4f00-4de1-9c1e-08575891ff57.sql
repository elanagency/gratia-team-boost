-- Fix security issue: Restrict point allocation insertions to platform admins only
-- Replace the overly permissive "true" condition with proper authorization

-- Drop existing policy
DROP POLICY "System can insert allocations" ON public.monthly_points_allocations;

-- Create secure policy - only platform admins can insert allocations
CREATE POLICY "Platform admins can insert allocations" 
ON public.monthly_points_allocations 
FOR INSERT 
WITH CHECK (is_platform_admin());