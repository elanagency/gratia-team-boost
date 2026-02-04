-- Add image_url column to giftbit_regions table
ALTER TABLE giftbit_regions 
ADD COLUMN IF NOT EXISTS image_url TEXT;