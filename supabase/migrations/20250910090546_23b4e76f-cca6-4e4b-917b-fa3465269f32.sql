-- Add a blacklist table for disabled products
CREATE TABLE IF NOT EXISTS public.platform_product_blacklist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  goody_product_id TEXT NOT NULL UNIQUE,
  disabled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  disabled_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_product_blacklist ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Platform admins can manage product blacklist" 
ON public.platform_product_blacklist 
FOR ALL 
USING (is_platform_admin()) 
WITH CHECK (is_platform_admin());