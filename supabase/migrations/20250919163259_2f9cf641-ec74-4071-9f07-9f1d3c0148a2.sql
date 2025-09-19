-- Add RLS policy to allow team members to read subscription status from their own company
CREATE POLICY "Team members can view their company subscription status" 
ON public.companies 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.company_id = companies.id 
    AND profiles.status = 'active'
  )
);