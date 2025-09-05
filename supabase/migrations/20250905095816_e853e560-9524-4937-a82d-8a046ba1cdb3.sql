-- Add environment_mode setting to platform_settings
INSERT INTO public.platform_settings (key, value, description)
VALUES (
  'environment_mode',
  '"test"',
  'Environment mode: test or live. Controls whether edge functions use test or production APIs.'
) ON CONFLICT (key) DO NOTHING;