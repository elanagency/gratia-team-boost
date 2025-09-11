-- Fix infinite recursion in profiles RLS policies
-- The issue is that the platform admin check function queries the same table it's protecting

-- First, create a simple SECURITY DEFINER function that bypasses RLS completely
CREATE OR REPLACE FUNCTION public.get_user_platform_admin_status(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(is_platform_admin, false) 
  FROM public.profiles 
  WHERE id = $1;
$$;

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Platform admins can view all profiles" ON public.profiles;

-- Create a new policy that uses the SECURITY DEFINER function to avoid recursion
CREATE POLICY "Platform admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.get_user_platform_admin_status() = true);

-- Also ensure the "Users can view their own profile" policy has priority for self-access
-- This policy should remain as is since it's direct and doesn't cause recursion