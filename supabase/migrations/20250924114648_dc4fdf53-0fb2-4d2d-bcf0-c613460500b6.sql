-- Add Stripe product and price ID columns to platform_settings
ALTER TABLE public.platform_settings 
ADD COLUMN stripe_product_id_live text,
ADD COLUMN stripe_product_id_test text,
ADD COLUMN stripe_price_id_live text,
ADD COLUMN stripe_price_id_test text;