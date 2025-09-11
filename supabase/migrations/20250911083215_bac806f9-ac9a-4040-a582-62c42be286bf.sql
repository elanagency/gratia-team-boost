-- Fix critical RLS security issues for profiles table

-- 1. Drop the dangerous "TEMP allow all read" policy that exposes all user data
DROP POLICY IF EXISTS "TEMP allow all read" ON public.profiles;

-- 2. Remove duplicate UPDATE policies (keeping the more specific one)
DROP POLICY IF EXISTS "User can update own profile" ON public.profiles;

-- 3. Improve the platform admin function to include company existence validation
CREATE OR REPLACE FUNCTION public.is_platform_admin_with_company_check(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(p.is_platform_admin, false) 
  FROM public.profiles p
  LEFT JOIN public.companies c ON p.company_id = c.id
  WHERE p.id = $1 
    AND p.is_platform_admin = true
    AND (p.company_id IS NULL OR c.id IS NOT NULL);
$$;

-- 4. Update the existing platform admin policy to use the new function
DROP POLICY IF EXISTS "Platform admins can view all profiles" ON public.profiles;
CREATE POLICY "Platform admins can view all profiles"
ON public.profiles
FOR SELECT
USING (is_platform_admin_with_company_check());

-- 5. Add company-based access control - company admins can view their team members
CREATE POLICY "Company admins can view team members"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles admin_profile
    WHERE admin_profile.id = auth.uid()
    AND admin_profile.company_id = profiles.company_id
    AND admin_profile.is_admin = true
    AND admin_profile.is_active = true
  )
);

-- 6. Add policy for team members to view other team members in their company
CREATE POLICY "Team members can view other team members"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles user_profile
    WHERE user_profile.id = auth.uid()
    AND user_profile.company_id = profiles.company_id
    AND user_profile.is_active = true
  )
);