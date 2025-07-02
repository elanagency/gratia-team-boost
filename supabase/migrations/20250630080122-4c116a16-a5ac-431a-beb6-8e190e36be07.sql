
-- Make company_id nullable in rewards table for global rewards
ALTER TABLE public.rewards 
ALTER COLUMN company_id DROP NOT NULL;

-- Drop all existing RLS policies for rewards table
DROP POLICY IF EXISTS "Platform admins can manage global rewards" ON public.rewards;
DROP POLICY IF EXISTS "Company admins can manage company rewards" ON public.rewards;  
DROP POLICY IF EXISTS "Users can view rewards" ON public.rewards;

-- Also drop any other existing policies that might exist
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.rewards;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.rewards;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.rewards;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON public.rewards;

-- Create updated policy for platform admins to manage global rewards (company_id is NULL)
CREATE POLICY "Platform admins can manage global rewards" 
ON public.rewards 
FOR ALL 
USING (
  company_id IS NULL AND public.is_platform_admin(auth.uid())
)
WITH CHECK (
  company_id IS NULL AND public.is_platform_admin(auth.uid())
);

-- Create policy for company admins to manage their company rewards (company_id is NOT NULL)
CREATE POLICY "Company admins can manage company rewards" 
ON public.rewards 
FOR ALL 
USING (
  company_id IS NOT NULL AND public.is_company_admin(company_id)
)
WITH CHECK (
  company_id IS NOT NULL AND public.is_company_admin(company_id)
);

-- Create policy for all authenticated users to view rewards (both global and company-specific)
CREATE POLICY "Users can view rewards" 
ON public.rewards 
FOR SELECT 
USING (
  company_id IS NULL OR public.is_member_of_company(company_id)
);
