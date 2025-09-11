-- Fix infinite recursion in profiles RLS policies
-- Create a new security definer function that bypasses RLS to check platform admin status
CREATE OR REPLACE FUNCTION public.check_platform_admin_bypass_rls(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  is_admin boolean := false;
BEGIN
  -- Temporarily disable RLS for this query to avoid recursion
  SET LOCAL row_security = off;
  
  -- Check if user is platform admin
  SELECT COALESCE(is_platform_admin, false) 
  INTO is_admin
  FROM public.profiles 
  WHERE id = $1;
  
  -- Re-enable RLS
  SET LOCAL row_security = on;
  
  RETURN is_admin;
END;
$function$;

-- Update the problematic RLS policy to use the new function
DROP POLICY IF EXISTS "Platform admins can view all profiles" ON public.profiles;

CREATE POLICY "Platform admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.check_platform_admin_bypass_rls() = true);

-- Also update other policies that might be using the problematic function
DROP POLICY IF EXISTS "Platform admins can view all companies" ON public.companies;

CREATE POLICY "Platform admins can view all companies" 
ON public.companies 
FOR SELECT 
USING (public.check_platform_admin_bypass_rls() = true);

-- Update other company policies to use the new function
DROP POLICY IF EXISTS "Platform admins can update any company" ON public.companies;
DROP POLICY IF EXISTS "Platform admins can delete companies" ON public.companies;
DROP POLICY IF EXISTS "Platform admins can insert companies" ON public.companies;

CREATE POLICY "Platform admins can update any company" 
ON public.companies 
FOR UPDATE 
USING (public.check_platform_admin_bypass_rls() = true)
WITH CHECK (public.check_platform_admin_bypass_rls() = true);

CREATE POLICY "Platform admins can delete companies" 
ON public.companies 
FOR DELETE 
USING (public.check_platform_admin_bypass_rls() = true);

CREATE POLICY "Platform admins can insert companies" 
ON public.companies 
FOR INSERT 
WITH CHECK (public.check_platform_admin_bypass_rls() = true);