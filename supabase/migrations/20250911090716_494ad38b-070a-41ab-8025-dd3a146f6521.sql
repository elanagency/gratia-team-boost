-- Fix remaining infinite recursion in profiles RLS policies
-- Create security definer functions that bypass RLS for company admin and team member checks

CREATE OR REPLACE FUNCTION public.check_user_is_company_admin_bypass_rls(user_id uuid, company_id uuid)
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
  
  -- Check if user is a company admin
  SELECT COALESCE(is_admin, false) 
  INTO is_admin
  FROM public.profiles 
  WHERE id = $1 AND company_id = $2 AND is_active = true;
  
  -- Re-enable RLS
  SET LOCAL row_security = on;
  
  RETURN is_admin;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_user_is_team_member_bypass_rls(user_id uuid, company_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  is_member boolean := false;
BEGIN
  -- Temporarily disable RLS for this query to avoid recursion
  SET LOCAL row_security = off;
  
  -- Check if user is a team member
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = $1 AND company_id = $2 AND is_active = true
  ) INTO is_member;
  
  -- Re-enable RLS
  SET LOCAL row_security = on;
  
  RETURN is_member;
END;
$function$;

-- Update the problematic RLS policies to use the new bypass functions
DROP POLICY IF EXISTS "Company admins can view team members" ON public.profiles;

CREATE POLICY "Company admins can view team members" 
ON public.profiles 
FOR SELECT 
USING (public.check_user_is_company_admin_bypass_rls(auth.uid(), profiles.company_id) = true);

DROP POLICY IF EXISTS "Team members can view other team members" ON public.profiles;

CREATE POLICY "Team members can view other team members" 
ON public.profiles 
FOR SELECT 
USING (public.check_user_is_team_member_bypass_rls(auth.uid(), profiles.company_id) = true);