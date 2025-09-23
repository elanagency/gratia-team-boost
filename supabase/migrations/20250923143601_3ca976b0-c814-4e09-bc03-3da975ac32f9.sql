-- Add environment field to goody_gift_cards table
ALTER TABLE public.goody_gift_cards 
ADD COLUMN environment text NOT NULL DEFAULT 'live';

-- Add check constraint for environment values
ALTER TABLE public.goody_gift_cards 
ADD CONSTRAINT goody_gift_cards_environment_check 
CHECK (environment IN ('sandbox', 'live'));

-- Create index for better performance when filtering by environment
CREATE INDEX idx_goody_gift_cards_environment_active 
ON public.goody_gift_cards (environment, is_active);

-- Update existing records to be 'live' environment (they're likely from live API)
UPDATE public.goody_gift_cards 
SET environment = 'live' 
WHERE environment IS NULL;