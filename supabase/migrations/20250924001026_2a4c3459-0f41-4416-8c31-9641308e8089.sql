-- Revert environment values from 'sandbox' back to 'test'
UPDATE public.goody_gift_cards 
SET environment = 'test' 
WHERE environment = 'sandbox';

UPDATE public.goody_products 
SET environment = 'test' 
WHERE environment = 'sandbox';