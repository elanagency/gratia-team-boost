-- Update RLS policy to allow authenticated users to read platform_settings key
DROP POLICY IF EXISTS "Authenticated users can read pricing settings" ON public.platform_settings;

CREATE POLICY "Authenticated users can read pricing settings" ON public.platform_settings
FOR SELECT USING (
  (auth.uid() IS NOT NULL) AND 
  (key = ANY (ARRAY['member_monthly_price_cents'::text, 'point_to_dollar_exchange_rate'::text, 'platform_settings'::text]))
);