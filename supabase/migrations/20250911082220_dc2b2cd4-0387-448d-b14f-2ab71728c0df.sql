-- Remove monthly spending limits functionality completely

-- Drop the member_monthly_spending table
DROP TABLE IF EXISTS public.member_monthly_spending;

-- Remove team_member_monthly_limit column from companies table
ALTER TABLE public.companies DROP COLUMN IF EXISTS team_member_monthly_limit;

-- Drop the update_monthly_spending trigger first
DROP TRIGGER IF EXISTS track_monthly_spending_trigger ON public.point_transactions;

-- Now drop the update_monthly_spending function
DROP FUNCTION IF EXISTS public.update_monthly_spending();

-- Drop the can_user_spend_points function
DROP FUNCTION IF EXISTS public.can_user_spend_points(uuid, uuid, integer);

-- Drop the get_user_monthly_spending function
DROP FUNCTION IF EXISTS public.get_user_monthly_spending(uuid, uuid);