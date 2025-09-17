-- Remove shipping fields from profiles table
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS shipping_name,
DROP COLUMN IF EXISTS shipping_address,
DROP COLUMN IF EXISTS shipping_city,
DROP COLUMN IF EXISTS shipping_state,
DROP COLUMN IF EXISTS shipping_zip_code,
DROP COLUMN IF EXISTS shipping_country,
DROP COLUMN IF EXISTS shipping_phone;

-- Add RLS policy for company admins to view monthly point allocations for their company
CREATE POLICY "Company admins can view their company allocations" 
ON public.monthly_points_allocations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.company_id = monthly_points_allocations.company_id 
    AND profiles.is_admin = true 
    AND profiles.status = 'active'
  )
);

-- Add RLS policy for company admins to manage point transactions in their company
CREATE POLICY "Company admins can view their company point transactions" 
ON public.point_transactions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.company_id = point_transactions.company_id 
    AND profiles.is_admin = true 
    AND profiles.status = 'active'
  )
);

-- Create company_point_transactions table if it doesn't exist (referenced in edge functions)
CREATE TABLE IF NOT EXISTS public.company_point_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  description TEXT NOT NULL,
  transaction_type TEXT NOT NULL,
  created_by UUID NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on company_point_transactions
ALTER TABLE public.company_point_transactions ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for company_point_transactions
CREATE POLICY "Platform admins can manage company point transactions" 
ON public.company_point_transactions 
FOR ALL 
USING (is_platform_admin())
WITH CHECK (is_platform_admin());

CREATE POLICY "Company admins can view their company point transactions" 
ON public.company_point_transactions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.company_id = company_point_transactions.company_id 
    AND profiles.is_admin = true 
    AND profiles.status = 'active'
  )
);