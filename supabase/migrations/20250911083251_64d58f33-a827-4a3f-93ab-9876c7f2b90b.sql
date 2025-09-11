-- Review and fix RLS policies for companies table

-- 1. Update the platform admin policy to use the new secure function
DROP POLICY IF EXISTS "Platform admins can view all companies" ON public.companies;
CREATE POLICY "Platform admins can view all companies"
ON public.companies
FOR SELECT
USING (is_platform_admin_with_company_check());

-- 2. Allow company admins to view their own company information
CREATE POLICY "Company admins can view their own company"
ON public.companies
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.company_id = companies.id
    AND profiles.is_admin = true
    AND profiles.is_active = true
  )
);

-- 3. Allow company admins to update their own company information
CREATE POLICY "Company admins can update their own company"
ON public.companies
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.company_id = companies.id
    AND profiles.is_admin = true
    AND profiles.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.company_id = companies.id
    AND profiles.is_admin = true
    AND profiles.is_active = true
  )
);

-- 4. Allow platform admins to insert new companies (for migration purposes)
CREATE POLICY "Platform admins can insert companies"
ON public.companies
FOR INSERT
WITH CHECK (is_platform_admin_with_company_check());

-- 5. Allow platform admins to update any company
CREATE POLICY "Platform admins can update any company"
ON public.companies
FOR UPDATE
USING (is_platform_admin_with_company_check())
WITH CHECK (is_platform_admin_with_company_check());

-- 6. Allow platform admins to delete companies
CREATE POLICY "Platform admins can delete companies"
ON public.companies
FOR DELETE
USING (is_platform_admin_with_company_check());