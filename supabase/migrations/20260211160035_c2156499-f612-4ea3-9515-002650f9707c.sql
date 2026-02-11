
-- Add celebration product ID columns to platform_settings
ALTER TABLE public.platform_settings
ADD COLUMN IF NOT EXISTS stripe_celebration_product_id_live text,
ADD COLUMN IF NOT EXISTS stripe_celebration_product_id_test text;
