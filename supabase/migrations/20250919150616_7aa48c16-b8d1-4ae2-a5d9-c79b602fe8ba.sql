-- Fix team member deletion constraint violation
-- Remove existing foreign key constraint that cascades profile deletion
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Add new foreign key constraint that allows profile to remain when auth user is deleted
-- This preserves transaction history while allowing user login removal
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE SET NULL;