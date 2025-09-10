-- Remove deprecated platform settings
DELETE FROM public.platform_settings 
WHERE key IN ('min_point_purchase', 'max_point_purchase', 'default_team_slots');

-- Drop the platform_payment_methods table as it's Rye-specific and no longer needed
DROP TABLE IF EXISTS public.platform_payment_methods;

-- Drop the trigger function if it exists
DROP FUNCTION IF EXISTS public.ensure_single_default_payment_method() CASCADE;