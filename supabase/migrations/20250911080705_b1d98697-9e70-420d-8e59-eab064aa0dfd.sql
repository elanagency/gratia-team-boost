-- Remove custom rewards system, keep only Goody gift cards

-- First, update reward_redemptions to use goody_gift_cards instead of rewards
ALTER TABLE public.reward_redemptions 
ADD COLUMN IF NOT EXISTS goody_product_id text;

-- Update carts table to use goody_product_id instead of reward_id
ALTER TABLE public.carts 
ADD COLUMN IF NOT EXISTS goody_product_id_ref text;

-- Drop foreign key constraints
ALTER TABLE public.reward_redemptions 
DROP CONSTRAINT IF EXISTS reward_redemptions_reward_id_fkey;

ALTER TABLE public.carts 
DROP CONSTRAINT IF EXISTS fk_carts_reward_id;

-- Drop the reward_id columns
ALTER TABLE public.reward_redemptions 
DROP COLUMN IF EXISTS reward_id;

ALTER TABLE public.carts 
DROP COLUMN IF EXISTS reward_id;

-- Drop reward category mapping table
DROP TABLE IF EXISTS public.reward_category_mappings CASCADE;

-- Drop reward categories table  
DROP TABLE IF EXISTS public.reward_categories CASCADE;

-- Drop rewards table
DROP TABLE IF EXISTS public.rewards CASCADE;

-- Update table comments
COMMENT ON TABLE public.reward_redemptions IS 'Tracks redemptions of Goody gift cards by users';
COMMENT ON COLUMN public.reward_redemptions.goody_product_id IS 'Reference to goody_gift_cards.goody_product_id';
COMMENT ON COLUMN public.carts.goody_product_id_ref IS 'Reference to goody_gift_cards.goody_product_id';