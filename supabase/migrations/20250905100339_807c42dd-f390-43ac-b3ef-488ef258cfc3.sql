-- Fix the environment_mode setting to be properly JSON-encoded
UPDATE public.platform_settings 
SET value = '"test"'::jsonb
WHERE key = 'environment_mode';