-- Drop obsolete triggers that cause double processing
DROP TRIGGER IF EXISTS check_sender_points_before_give_trigger ON public.point_transactions;
DROP TRIGGER IF EXISTS update_points_after_transaction ON public.point_transactions;

-- Drop obsolete functions that are no longer needed
DROP FUNCTION IF EXISTS public.check_sender_points_before_give();
DROP FUNCTION IF EXISTS public.update_member_points();