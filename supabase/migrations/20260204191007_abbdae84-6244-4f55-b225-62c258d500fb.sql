-- Add giftbit_region_id column to store the numeric Giftbit API region ID
ALTER TABLE giftbit_regions 
ADD COLUMN IF NOT EXISTS giftbit_region_id INTEGER;