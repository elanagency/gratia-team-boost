-- Create table to store synced gift card IDs
CREATE TABLE public.goody_gift_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  goody_product_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  last_synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.goody_gift_cards ENABLE ROW LEVEL SECURITY;

-- Create policies for platform admins only
CREATE POLICY "Platform admins can manage gift cards" 
ON public.goody_gift_cards 
FOR ALL 
USING (is_platform_admin())
WITH CHECK (is_platform_admin());

-- Create index for faster lookups
CREATE INDEX idx_goody_gift_cards_product_id ON public.goody_gift_cards(goody_product_id);
CREATE INDEX idx_goody_gift_cards_active ON public.goody_gift_cards(is_active) WHERE is_active = true;