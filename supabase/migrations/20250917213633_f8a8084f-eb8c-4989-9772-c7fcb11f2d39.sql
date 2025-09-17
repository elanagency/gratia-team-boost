-- Fix existing data: Set is_active to false for all users who are still in 'invited' status
-- These users have never logged in but were incorrectly marked as active
UPDATE public.profiles 
SET is_active = false 
WHERE invitation_status = 'invited' AND is_active = true;

-- Add a comment to document this fix
COMMENT ON TABLE public.profiles IS 'User profiles table. is_active should only be true for users with invitation_status = active (users who have logged in at least once).';