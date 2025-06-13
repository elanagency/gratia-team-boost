
-- Create a table to store platform payment methods
CREATE TABLE public.platform_payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  spreedly_token TEXT NOT NULL UNIQUE,
  card_last_four TEXT NOT NULL,
  card_type TEXT,
  expiry_month TEXT NOT NULL,
  expiry_year TEXT NOT NULL,
  cardholder_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security
ALTER TABLE public.platform_payment_methods ENABLE ROW LEVEL SECURITY;

-- Create policies for platform admin access only
CREATE POLICY "Platform admins can manage payment methods" 
  ON public.platform_payment_methods 
  FOR ALL 
  USING (public.is_platform_admin());

-- Create index for better performance
CREATE INDEX idx_platform_payment_methods_token ON public.platform_payment_methods(spreedly_token);
CREATE INDEX idx_platform_payment_methods_status ON public.platform_payment_methods(status);
