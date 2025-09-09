-- Add monthly_points column to company_members table
ALTER TABLE public.company_members 
ADD COLUMN monthly_points INTEGER DEFAULT 0 NOT NULL;

-- Update the allocate_monthly_points function to use monthly_points instead of points
CREATE OR REPLACE FUNCTION public.allocate_monthly_points(target_company_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  current_month TEXT := to_char(now(), 'YYYY-MM');
  allocation_count INTEGER := 0;
  member_record RECORD;
BEGIN
  -- Allocate 100 points to all company members (admin and non-admin) in monthly_points
  FOR member_record IN 
    SELECT user_id FROM public.company_members 
    WHERE company_id = target_company_id
  LOOP
    -- Check if allocation already exists for this month
    IF NOT EXISTS (
      SELECT 1 FROM public.monthly_points_allocations 
      WHERE company_id = target_company_id 
      AND user_id = member_record.user_id 
      AND allocation_month = current_month
    ) THEN
      -- Insert allocation record
      INSERT INTO public.monthly_points_allocations (
        company_id, user_id, points_allocated, allocation_month
      ) VALUES (
        target_company_id, member_record.user_id, 100, current_month
      );
      
      -- Add points to member's monthly_points instead of points
      UPDATE public.company_members 
      SET monthly_points = monthly_points + 100
      WHERE company_id = target_company_id 
      AND user_id = member_record.user_id;
      
      allocation_count := allocation_count + 1;
    END IF;
  END LOOP;
  
  RETURN allocation_count;
END;
$function$;

-- Update the check_sender_points_before_give function to use monthly_points for giving
CREATE OR REPLACE FUNCTION public.check_sender_points_before_give()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Check if the sender has enough monthly_points to give
  IF NOT EXISTS (
    SELECT 1 FROM public.company_members
    WHERE company_id = NEW.company_id 
    AND user_id = NEW.sender_id
    AND monthly_points >= NEW.points
  ) THEN
    RAISE EXCEPTION 'You do not have enough monthly points to give % points', NEW.points;
  END IF;

  -- Deduct points from the sender's monthly_points balance
  UPDATE public.company_members
  SET monthly_points = monthly_points - NEW.points
  WHERE company_id = NEW.company_id AND user_id = NEW.sender_id;
  
  RETURN NEW;
END;
$function$;

-- Update the update_member_points function to add to recognition points (points column)
CREATE OR REPLACE FUNCTION public.update_member_points()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Add to recognition points (points column) when receiving points
  UPDATE public.company_members
  SET points = points + NEW.points
  WHERE company_id = NEW.company_id AND user_id = NEW.recipient_id;
  RETURN NEW;
END;
$function$;