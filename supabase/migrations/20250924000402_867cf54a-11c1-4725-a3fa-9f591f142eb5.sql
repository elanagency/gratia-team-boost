-- Update environment values from 'test' to 'sandbox' for consistency
UPDATE public.goody_gift_cards 
SET environment = 'sandbox' 
WHERE environment = 'test';

UPDATE public.goody_products 
SET environment = 'sandbox' 
WHERE environment = 'test';