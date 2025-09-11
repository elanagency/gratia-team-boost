-- Remove slot-related columns from subscription_events table
ALTER TABLE public.subscription_events 
DROP COLUMN IF EXISTS previous_slots,
DROP COLUMN IF EXISTS new_slots;

-- Remove team_slots column from companies table
ALTER TABLE public.companies 
DROP COLUMN IF EXISTS team_slots;

-- Drop slot-related database functions
DROP FUNCTION IF EXISTS public.get_used_team_slots(uuid);
DROP FUNCTION IF EXISTS public.has_available_team_slots(uuid);

-- Update subscription_events table to focus on usage-based billing
COMMENT ON TABLE public.subscription_events IS 'Tracks subscription changes based on actual team member usage';
COMMENT ON COLUMN public.subscription_events.previous_quantity IS 'Previous number of team members';
COMMENT ON COLUMN public.subscription_events.new_quantity IS 'New number of team members';