-- Create giftbit_brands table for storing brand catalog
CREATE TABLE public.giftbit_brands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  disclaimer TEXT,
  image_url TEXT,
  min_price_in_cents INTEGER,
  max_price_in_cents INTEGER,
  allowed_prices_in_cents INTEGER[],
  price_is_variable BOOLEAN DEFAULT true,
  currency_code TEXT DEFAULT 'AUD',
  region_code TEXT NOT NULL,
  environment TEXT NOT NULL DEFAULT 'testbed',
  is_active BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  brand_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(brand_code, environment)
);

-- Create giftbit_regions table for available regions
CREATE TABLE public.giftbit_regions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  region_code TEXT NOT NULL,
  name TEXT NOT NULL,
  currency_code TEXT DEFAULT 'AUD',
  environment TEXT NOT NULL DEFAULT 'testbed',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(region_code, environment)
);

-- Add Giftbit columns to redemptions table
ALTER TABLE public.redemptions
  ADD COLUMN IF NOT EXISTS giftbit_gift_id TEXT,
  ADD COLUMN IF NOT EXISTS giftbit_order_id TEXT,
  ADD COLUMN IF NOT EXISTS giftbit_claim_link TEXT,
  ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'goody';

-- Enable RLS on new tables
ALTER TABLE public.giftbit_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.giftbit_regions ENABLE ROW LEVEL SECURITY;

-- RLS policies for giftbit_brands (read-only for authenticated users, full access for platform admins)
CREATE POLICY "Authenticated users can view active brands"
  ON public.giftbit_brands
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Platform admins can manage brands"
  ON public.giftbit_brands
  FOR ALL
  USING (public.check_platform_admin_bypass_rls(auth.uid()));

-- RLS policies for giftbit_regions
CREATE POLICY "Authenticated users can view regions"
  ON public.giftbit_regions
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Platform admins can manage regions"
  ON public.giftbit_regions
  FOR ALL
  USING (public.check_platform_admin_bypass_rls(auth.uid()));

-- Insert default Australia region for testbed
INSERT INTO public.giftbit_regions (region_code, name, currency_code, environment)
VALUES ('AU', 'Australia', 'AUD', 'testbed')
ON CONFLICT (region_code, environment) DO NOTHING;

-- Create index for faster region-based queries
CREATE INDEX idx_giftbit_brands_region_env ON public.giftbit_brands(region_code, environment);
CREATE INDEX idx_giftbit_brands_active ON public.giftbit_brands(is_active, environment);