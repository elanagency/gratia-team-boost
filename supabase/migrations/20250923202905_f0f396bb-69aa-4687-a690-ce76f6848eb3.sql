-- Drop the existing unique constraint on goody_product_id only
ALTER TABLE public.goody_gift_cards 
DROP CONSTRAINT IF EXISTS goody_gift_cards_goody_product_id_key;

-- Create a new composite unique constraint on (goody_product_id, environment)
ALTER TABLE public.goody_gift_cards 
ADD CONSTRAINT goody_gift_cards_goody_product_id_environment_key 
UNIQUE (goody_product_id, environment);

-- Create an index to support efficient queries by product ID and environment
CREATE INDEX IF NOT EXISTS idx_goody_gift_cards_product_environment 
ON public.goody_gift_cards (goody_product_id, environment);