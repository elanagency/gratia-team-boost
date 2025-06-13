
-- Add shipping information fields to the profiles table
ALTER TABLE public.profiles 
ADD COLUMN shipping_name TEXT,
ADD COLUMN shipping_address TEXT,
ADD COLUMN shipping_city TEXT,
ADD COLUMN shipping_state TEXT,
ADD COLUMN shipping_zip_code TEXT,
ADD COLUMN shipping_country TEXT;
