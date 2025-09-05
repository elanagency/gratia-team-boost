-- Fix the environment_mode setting value to be properly JSON-encoded string
UPDATE public.platform_settings 
SET value = jsonb_build_object('data', 'test') 
WHERE key = 'environment_mode';