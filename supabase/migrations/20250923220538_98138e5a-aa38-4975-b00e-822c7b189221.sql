-- Add brand_id column to goody_gift_cards table to store brand ID from API
ALTER TABLE public.goody_gift_cards 
ADD COLUMN brand_id text;