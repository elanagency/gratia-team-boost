-- Add INSERT policy for company admins to add regions during initial setup
CREATE POLICY "Company admins can insert their own regions during setup"
ON public.company_regions
FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT profiles.company_id
    FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
    AND profiles.status = 'active'
  )
  AND 
  EXISTS (
    SELECT 1 FROM public.companies
    WHERE companies.id = company_id
    AND companies.region_setup_complete = false
  )
);