-- Add columns to store full product data in goody_gift_cards table
ALTER TABLE public.goody_gift_cards 
ADD COLUMN IF NOT EXISTS product_data jsonb,
ADD COLUMN IF NOT EXISTS price integer,
ADD COLUMN IF NOT EXISTS image_url text,
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS subtitle text;