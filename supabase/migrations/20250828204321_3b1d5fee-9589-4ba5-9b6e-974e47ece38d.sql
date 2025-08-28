-- Drop the old company balance trigger and function
DROP TRIGGER IF EXISTS check_company_points_before_give_trigger ON public.point_transactions;
DROP FUNCTION IF EXISTS public.check_company_points_before_give();

-- Create new function to check sender's personal points balance
CREATE OR REPLACE FUNCTION public.check_sender_points_before_give()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the sender has enough personal points
  IF NOT EXISTS (
    SELECT 1 FROM public.company_members
    WHERE company_id = NEW.company_id 
    AND user_id = NEW.sender_id
    AND points >= NEW.points
  ) THEN
    RAISE EXCEPTION 'You do not have enough points to give % points', NEW.points;
  END IF;

  -- Deduct points from the sender's personal balance
  UPDATE public.company_members
  SET points = points - NEW.points
  WHERE company_id = NEW.company_id AND user_id = NEW.sender_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger to check sender points before giving
CREATE TRIGGER check_sender_points_before_give_trigger
  BEFORE INSERT ON public.point_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.check_sender_points_before_give();