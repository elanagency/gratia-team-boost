-- Create the new goody_gift_cards table for filtered gift card products
CREATE TABLE public.goody_gift_cards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  goody_product_id text NOT NULL UNIQUE,
  name text NOT NULL,
  subtitle text,
  description text,
  brand_name text NOT NULL,
  brand_id text,
  price integer,
  price_is_variable boolean NOT NULL DEFAULT false,
  image_url text,
  environment text NOT NULL DEFAULT 'live',
  product_data jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  last_synced_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on the new table
ALTER TABLE public.goody_gift_cards ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for the new table
CREATE POLICY "Platform admins can manage gift cards" 
ON public.goody_gift_cards 
FOR ALL 
USING (is_platform_admin()) 
WITH CHECK (is_platform_admin());

CREATE POLICY "Anyone can view gift cards catalog" 
ON public.goody_gift_cards 
FOR SELECT 
USING (true);

-- Create indexes for performance
CREATE INDEX idx_goody_gift_cards_goody_product_id ON public.goody_gift_cards(goody_product_id);
CREATE INDEX idx_goody_gift_cards_environment ON public.goody_gift_cards(environment);
CREATE INDEX idx_goody_gift_cards_brand_id ON public.goody_gift_cards(brand_id);
CREATE INDEX idx_goody_gift_cards_is_active ON public.goody_gift_cards(is_active);

-- Create function to sync gift cards from goody_products to goody_gift_cards
CREATE OR REPLACE FUNCTION public.sync_gift_cards_from_products(target_environment text DEFAULT 'live')
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  gift_card_brand_id text := '84b0c3a9-b51c-4f0c-babe-117a0c6b353b';
  synced_count integer := 0;
BEGIN
  -- Insert or update gift cards from goody_products where brand_id matches gift cards brand
  INSERT INTO public.goody_gift_cards (
    goody_product_id,
    name,
    subtitle,
    description,
    brand_name,
    brand_id,
    price,
    price_is_variable,
    image_url,
    environment,
    product_data,
    is_active,
    last_synced_at
  )
  SELECT 
    p.goody_product_id,
    p.name,
    p.subtitle,
    p.description,
    p.brand_name,
    p.brand_id,
    p.price,
    p.price_is_variable,
    p.image_url,
    p.environment,
    p.product_data,
    p.is_active,
    now()
  FROM public.goody_products p
  WHERE p.brand_id = gift_card_brand_id
    AND p.environment = target_environment
    AND p.is_active = true
  ON CONFLICT (goody_product_id) 
  DO UPDATE SET
    name = EXCLUDED.name,
    subtitle = EXCLUDED.subtitle,
    description = EXCLUDED.description,
    brand_name = EXCLUDED.brand_name,
    brand_id = EXCLUDED.brand_id,
    price = EXCLUDED.price,
    price_is_variable = EXCLUDED.price_is_variable,
    image_url = EXCLUDED.image_url,
    environment = EXCLUDED.environment,
    product_data = EXCLUDED.product_data,
    is_active = EXCLUDED.is_active,
    updated_at = now(),
    last_synced_at = now();

  GET DIAGNOSTICS synced_count = ROW_COUNT;
  
  RETURN synced_count;
END;
$$;