-- Update can_user_spend_points function to use profiles table instead of company_members
CREATE OR REPLACE FUNCTION public.can_user_spend_points(user_id uuid, company_id uuid, points_to_spend integer)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT 
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE company_id = $2 AND id = $1 AND is_admin = true
      ) THEN true  -- Admins have no spending limits
      ELSE 
        COALESCE(
          (SELECT team_member_monthly_limit FROM public.companies WHERE id = $2), 0
        ) >= (
          public.get_user_monthly_spending($1, $2) + $3
        )
    END;
$function$;