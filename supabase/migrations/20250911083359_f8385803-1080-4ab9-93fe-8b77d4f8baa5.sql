-- Fix security issue: Restrict access to subscription_events table
-- Currently the table may have public read access, need to secure it properly

-- Ensure RLS is enabled on subscription_events table
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start fresh
DROP POLICY IF EXISTS "Platform admins can view all subscription events" ON public.subscription_events;

-- 1. Platform admins can view all subscription events
CREATE POLICY "Platform admins can view all subscription events"
ON public.subscription_events
FOR SELECT
USING (is_platform_admin_with_company_check());

-- 2. Company admins can view their own company's subscription events only
CREATE POLICY "Company admins can view own company subscription events"
ON public.subscription_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.company_id = subscription_events.company_id
    AND profiles.is_admin = true
    AND profiles.is_active = true
  )
);

-- 3. Platform admins can insert subscription events (for system operations)
CREATE POLICY "Platform admins can insert subscription events"
ON public.subscription_events
FOR INSERT
WITH CHECK (is_platform_admin_with_company_check());

-- 4. Ensure no other access is allowed - explicitly deny all other operations
-- Only platform admins and company admins (for their own company) should have access