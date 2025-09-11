-- Allow all authenticated users to read pricing-related platform settings
CREATE POLICY "Authenticated users can read pricing settings" ON public.platform_settings
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND key IN ('member_monthly_price_cents', 'point_to_dollar_exchange_rate')
);