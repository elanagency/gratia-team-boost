-- Add the dedicated columns for platform settings
ALTER TABLE public.platform_settings 
ADD COLUMN IF NOT EXISTS point_exchange_rate REAL DEFAULT 0.03,
ADD COLUMN IF NOT EXISTS monthly_price_per_team_member_in_cents REAL DEFAULT 299;

-- Update the existing row with key='platform_settings' to have the new column values
UPDATE public.platform_settings 
SET 
  point_exchange_rate = 0.03,
  monthly_price_per_team_member_in_cents = 299
WHERE key = 'platform_settings';