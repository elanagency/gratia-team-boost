-- Allow company admins to read the member monthly price setting specifically
CREATE POLICY "Allow company admins to view member pricing setting" 
ON public.platform_settings 
FOR SELECT 
USING (
  key = 'member_monthly_price_cents' 
  AND EXISTS (
    SELECT 1 FROM public.company_members 
    WHERE user_id = auth.uid() 
    AND is_admin = true
  )
);