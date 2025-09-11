-- Fix ambiguous column references by dropping policies first, then functions, then recreating

-- Drop policies that depend on the functions
DROP POLICY IF EXISTS "Company admins can view team members" ON public.profiles;
DROP POLICY IF EXISTS "Team members can view other team members" ON public.profiles;

-- Now drop the functions
DROP FUNCTION IF EXISTS public.check_user_is_company_admin_bypass_rls(uuid, uuid);
DROP FUNCTION IF EXISTS public.check_user_is_team_member_bypass_rls(uuid, uuid);

-- Recreate functions with non-conflicting parameter names
CREATE OR REPLACE FUNCTION public.check_user_is_company_admin_bypass_rls(check_user_id uuid, check_company_id uuid)
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
  
  -- Check if user is a company admin (use qualified column names to avoid ambiguity)
  SELECT COALESCE(profiles.is_admin, false) 
  INTO is_admin
  FROM public.profiles 
  WHERE profiles.id = check_user_id AND profiles.company_id = check_company_id AND profiles.is_active = true;
  
  -- Re-enable RLS
  SET LOCAL row_security = on;
  
  RETURN is_admin;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_user_is_team_member_bypass_rls(check_user_id uuid, check_company_id uuid)
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
  
  -- Check if user is a team member (use qualified column names to avoid ambiguity)
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = check_user_id AND profiles.company_id = check_company_id AND profiles.is_active = true
  ) INTO is_member;
  
  -- Re-enable RLS
  SET LOCAL row_security = on;
  
  RETURN is_member;
END;
$function$;

-- Recreate the RLS policies with the corrected function signatures
CREATE POLICY "Company admins can view team members" 
ON public.profiles 
FOR SELECT 
USING (public.check_user_is_company_admin_bypass_rls(auth.uid(), profiles.company_id) = true);

CREATE POLICY "Team members can view other team members" 
ON public.profiles 
FOR SELECT 
USING (public.check_user_is_team_member_bypass_rls(auth.uid(), profiles.company_id) = true);