-- Fix existing point_exchange_rate to be stored as a number instead of string
UPDATE public.platform_settings 
SET value = '0.03'::jsonb 
WHERE key = 'point_exchange_rate' AND value = '"0.03"'::jsonb;