-- Create redemptions table to track gift card orders
CREATE TABLE public.redemptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_id UUID NOT NULL,
  reward_id TEXT NOT NULL,
  reward_name TEXT NOT NULL,
  points_spent INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'created',
  shipping_address JSONB,
  goody_order_id TEXT,
  goody_order_batch_id TEXT,
  individual_gift_link TEXT,
  redemption_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.redemptions ENABLE ROW LEVEL SECURITY;

-- Create policies for redemptions access
CREATE POLICY "Users can view their own redemptions" 
ON public.redemptions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Company admins can view their company redemptions" 
ON public.redemptions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.company_id = redemptions.company_id 
  AND profiles.is_admin = true 
  AND profiles.status = 'active'
));

CREATE POLICY "Platform admins can view all redemptions" 
ON public.redemptions 
FOR SELECT 
USING (is_platform_admin());

CREATE POLICY "System can insert redemptions" 
ON public.redemptions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_redemptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_redemptions_updated_at
BEFORE UPDATE ON public.redemptions
FOR EACH ROW
EXECUTE FUNCTION public.update_redemptions_updated_at();