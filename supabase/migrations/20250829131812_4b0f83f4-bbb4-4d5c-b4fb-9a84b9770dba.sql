-- Update the get_used_team_slots function to only count active team members
CREATE OR REPLACE FUNCTION public.get_used_team_slots(company_id uuid)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT COUNT(*)::INTEGER
  FROM public.company_members
  WHERE company_id = $1 
    AND is_admin = false 
    AND invitation_status = 'active';
$function$