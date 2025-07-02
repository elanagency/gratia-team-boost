
-- Enable Row Level Security on rewards table (if not already enabled)
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

-- Create policy for platform admins to manage global rewards
CREATE POLICY "Platform admins can manage global rewards" 
ON public.rewards 
FOR ALL 
USING (
  is_global = true AND public.is_platform_admin(auth.uid())
)
WITH CHECK (
  is_global = true AND public.is_platform_admin(auth.uid())
);

-- Create policy for company admins to manage their company rewards
CREATE POLICY "Company admins can manage company rewards" 
ON public.rewards 
FOR ALL 
USING (
  is_global = false AND public.is_company_admin(company_id)
)
WITH CHECK (
  is_global = false AND public.is_company_admin(company_id)
);

-- Create policy for all authenticated users to view rewards (both global and company-specific)
CREATE POLICY "Users can view rewards" 
ON public.rewards 
FOR SELECT 
USING (
  is_global = true OR public.is_member_of_company(company_id)
);
