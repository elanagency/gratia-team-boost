CREATE OR REPLACE FUNCTION public.get_stripe_active_member_count(company_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.profiles
  WHERE company_id = $1 
  AND status = 'active';
$$;