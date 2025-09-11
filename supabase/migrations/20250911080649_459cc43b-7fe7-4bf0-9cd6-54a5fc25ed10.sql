-- Remove custom rewards system, keep only Goody gift cards

-- First, update reward_redemptions to use goody_gift_cards instead of rewards
ALTER TABLE public.reward_redemptions 
ADD COLUMN IF NOT EXISTS goody_product_id text;

-- Drop foreign key constraint if it exists
ALTER TABLE public.reward_redemptions 
DROP CONSTRAINT IF EXISTS reward_redemptions_reward_id_fkey;

-- Drop the reward_id column after adding goody_product_id
ALTER TABLE public.reward_redemptions 
DROP COLUMN IF EXISTS reward_id;

-- Drop reward category mapping table
DROP TABLE IF EXISTS public.reward_category_mappings;

-- Drop reward categories table
DROP TABLE IF EXISTS public.reward_categories;

-- Drop rewards table
DROP TABLE IF EXISTS public.rewards;

-- Update reward_redemptions table comment
COMMENT ON TABLE public.reward_redemptions IS 'Tracks redemptions of Goody gift cards by users';
COMMENT ON COLUMN public.reward_redemptions.goody_product_id IS 'Reference to goody_gift_cards.goody_product_id';