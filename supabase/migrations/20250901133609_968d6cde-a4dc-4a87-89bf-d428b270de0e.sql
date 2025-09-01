-- Remove Rye-specific columns from rewards table
ALTER TABLE public.rewards DROP COLUMN IF EXISTS rye_product_url;

-- Remove Rye-specific columns from reward_redemptions table  
ALTER TABLE public.reward_redemptions DROP COLUMN IF EXISTS rye_cart_id;
ALTER TABLE public.reward_redemptions DROP COLUMN IF EXISTS rye_order_id;

-- Remove Rye-specific columns from carts table
ALTER TABLE public.carts DROP COLUMN IF EXISTS rye_cart_id;

-- Add generic columns for future integration
ALTER TABLE public.rewards ADD COLUMN IF NOT EXISTS product_url text;
ALTER TABLE public.reward_redemptions ADD COLUMN IF NOT EXISTS external_cart_id text;
ALTER TABLE public.reward_redemptions ADD COLUMN IF NOT EXISTS external_order_id text;
ALTER TABLE public.carts ADD COLUMN IF NOT EXISTS external_cart_id text;