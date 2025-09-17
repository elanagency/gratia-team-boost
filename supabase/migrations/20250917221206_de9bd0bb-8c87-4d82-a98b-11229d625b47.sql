-- Step 1: Add new status column with enum constraint  
ALTER TABLE public.profiles 
ADD COLUMN status TEXT CHECK (status IN ('invited', 'active', 'deactivated')) DEFAULT 'invited';

-- Step 2: Migrate existing data to new status field
UPDATE public.profiles 
SET status = CASE 
  WHEN invitation_status = 'invited' AND is_active = false THEN 'invited'
  WHEN invitation_status = 'active' AND is_active = true THEN 'active'
  WHEN invitation_status = 'active' AND is_active = false THEN 'deactivated'
  ELSE 'invited'
END;

-- Step 3: Make status column NOT NULL after data migration
ALTER TABLE public.profiles ALTER COLUMN status SET NOT NULL;

-- Step 4: Update all RLS policies to use the new status field

-- Update companies table policies
DROP POLICY IF EXISTS "Company admins can view their own company" ON public.companies;
CREATE POLICY "Company admins can view their own company" ON public.companies
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.company_id = companies.id 
    AND profiles.is_admin = true 
    AND profiles.status = 'active'
  )
);

DROP POLICY IF EXISTS "Company admins can update their own company" ON public.companies;
CREATE POLICY "Company admins can update their own company" ON public.companies
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.company_id = companies.id 
    AND profiles.is_admin = true 
    AND profiles.status = 'active'
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.company_id = companies.id 
    AND profiles.is_admin = true 
    AND profiles.status = 'active'
  )
);

-- Update subscription_events table policies
DROP POLICY IF EXISTS "Company admins can view own company subscription events" ON public.subscription_events;
CREATE POLICY "Company admins can view own company subscription events" ON public.subscription_events
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.company_id = subscription_events.company_id 
    AND profiles.is_admin = true 
    AND profiles.status = 'active'
  )
);

-- Update point_transactions table policies
DROP POLICY IF EXISTS "Company members can view own company transactions" ON public.point_transactions;
CREATE POLICY "Company members can view own company transactions" ON public.point_transactions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles user_profile 
    WHERE user_profile.id = auth.uid() 
    AND user_profile.company_id = point_transactions.company_id 
    AND user_profile.status = 'active'
  )
);

DROP POLICY IF EXISTS "System can insert point transactions" ON public.point_transactions;
CREATE POLICY "System can insert point transactions" ON public.point_transactions
FOR INSERT WITH CHECK (
  auth.uid() = sender_profile_id 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = point_transactions.sender_profile_id 
    AND profiles.status = 'active'
  )
);

-- Update departments table policies
DROP POLICY IF EXISTS "Company members can view their company departments" ON public.departments;
CREATE POLICY "Company members can view their company departments" ON public.departments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.company_id = departments.company_id 
    AND profiles.status = 'active'
  )
);

DROP POLICY IF EXISTS "Company admins can manage their company departments" ON public.departments;
CREATE POLICY "Company admins can manage their company departments" ON public.departments
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.company_id = departments.company_id 
    AND profiles.is_admin = true 
    AND profiles.status = 'active'
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.company_id = departments.company_id 
    AND profiles.is_admin = true 
    AND profiles.status = 'active'
  )
);

-- Step 5: Now drop old columns
ALTER TABLE public.profiles DROP COLUMN invitation_status;
ALTER TABLE public.profiles DROP COLUMN is_active;