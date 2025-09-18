-- Create a dedicated function to count stripe-billable active members (non-admin only)
CREATE OR REPLACE FUNCTION public.get_stripe_active_member_count(company_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COUNT(*)::INTEGER
  FROM public.profiles
  WHERE company_id = $1 
  AND status = 'active' 
  AND is_admin = false;
$function$;