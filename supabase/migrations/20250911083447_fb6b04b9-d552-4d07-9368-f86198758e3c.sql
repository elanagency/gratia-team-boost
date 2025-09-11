-- Fix security issue: Restrict access to point_transactions table
-- Employee point transaction history should only be visible to company members and admins

-- Ensure RLS is enabled on point_transactions table
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Platform admins can view all point transactions" ON public.point_transactions;

-- 1. Platform admins can view all point transactions across all companies
CREATE POLICY "Platform admins can view all point transactions"
ON public.point_transactions
FOR SELECT
USING (is_platform_admin_with_company_check());

-- 2. Company members can view transactions within their own company only
CREATE POLICY "Company members can view own company transactions"
ON public.point_transactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles sender_profile
    WHERE sender_profile.id = auth.uid()
    AND sender_profile.company_id = point_transactions.company_id
    AND sender_profile.is_active = true
  )
);

-- 3. Users can view transactions where they are either sender or recipient
CREATE POLICY "Users can view their own transactions"
ON public.point_transactions
FOR SELECT
USING (
  auth.uid() = sender_profile_id OR auth.uid() = recipient_profile_id
);

-- 4. System can insert point transactions (when users give points)
CREATE POLICY "System can insert point transactions"
ON public.point_transactions
FOR INSERT
WITH CHECK (
  -- Verify the sender is the authenticated user and has enough points
  auth.uid() = sender_profile_id
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = sender_profile_id
    AND monthly_points >= point_transactions.points
    AND is_active = true
  )
);

-- 5. Company admins can view all transactions in their company
CREATE POLICY "Company admins can view company transactions"
ON public.point_transactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles admin_profile
    WHERE admin_profile.id = auth.uid()
    AND admin_profile.company_id = point_transactions.company_id
    AND admin_profile.is_admin = true
    AND admin_profile.is_active = true
  )
);