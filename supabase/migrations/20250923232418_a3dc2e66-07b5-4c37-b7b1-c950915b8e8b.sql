-- Update the environment check constraint to allow 'test' environment
ALTER TABLE public.goody_gift_cards 
DROP CONSTRAINT IF EXISTS goody_gift_cards_environment_check;

ALTER TABLE public.goody_gift_cards 
ADD CONSTRAINT goody_gift_cards_environment_check 
CHECK (environment = ANY (ARRAY['sandbox'::text, 'live'::text, 'test'::text]));