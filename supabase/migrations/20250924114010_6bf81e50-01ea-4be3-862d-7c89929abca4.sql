-- Add RLS policy to allow company admins to update team members' profiles
CREATE POLICY "Company admins can update team members" ON public.profiles
FOR UPDATE USING (
  check_user_is_company_admin_bypass_rls(auth.uid(), company_id) = true
);