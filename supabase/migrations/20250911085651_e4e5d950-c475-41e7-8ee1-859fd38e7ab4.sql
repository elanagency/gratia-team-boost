-- Fix the platform admin function to properly check platform admin status
-- The current function has a problematic condition that can block platform admins
CREATE OR REPLACE FUNCTION public.is_platform_admin_with_company_check(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT COALESCE(is_platform_admin, false) 
  FROM public.profiles 
  WHERE id = $1 AND is_platform_admin = true;
$function$;