-- Remove the environment_mode setting from platform_settings as it's now company-specific
DELETE FROM public.platform_settings WHERE key = 'environment_mode';