-- Update database functions to use the new status field and fix search path issues

CREATE OR REPLACE FUNCTION public.allocate_monthly_points(target_company_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  current_month TEXT := to_char(now(), 'YYYY-MM');
  allocation_count INTEGER := 0;
  profile_record RECORD;
BEGIN
  -- Reset monthly_points to 100 for all active company members (admin and non-admin)
  FOR profile_record IN 
    SELECT id FROM public.profiles 
    WHERE company_id = target_company_id
    AND status = 'active'
  LOOP
    -- Check if allocation already exists for this month
    IF NOT EXISTS (
      SELECT 1 FROM public.monthly_points_allocations 
      WHERE company_id = target_company_id 
      AND user_id = profile_record.id 
      AND allocation_month = current_month
    ) THEN
      -- Insert allocation record
      INSERT INTO public.monthly_points_allocations (
        company_id, user_id, points_allocated, allocation_month
      ) VALUES (
        target_company_id, profile_record.id, 100, current_month
      );
      
      -- Reset member's monthly_points to 100
      UPDATE public.profiles 
      SET monthly_points = 100
      WHERE id = profile_record.id;
      
      allocation_count := allocation_count + 1;
    END IF;
  END LOOP;
  
  RETURN allocation_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_company_member_count(company_id uuid)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT COUNT(*)::INTEGER
  FROM public.profiles
  WHERE company_id = $1 AND status = 'active';
$function$;

CREATE OR REPLACE FUNCTION public.check_user_company_membership(profile_id uuid, company_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = $1 AND company_id = $2 AND status = 'active'
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_company_membership(profile_id uuid, company_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = $1 AND company_id = $2 AND status = 'active'
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  new_company_id uuid;
BEGIN
  -- Create company if provided and get its ID
  IF NEW.raw_user_meta_data->>'companyName' IS NOT NULL THEN
    INSERT INTO public.companies (name)
    VALUES (NEW.raw_user_meta_data->>'companyName')
    RETURNING id INTO new_company_id;
  END IF;

  -- Insert into profiles with the auth user ID and company info
  INSERT INTO public.profiles (
    id, 
    first_name, 
    last_name, 
    company_id,
    is_admin,
    role,
    monthly_points,
    status
  ) VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'firstName',
    NEW.raw_user_meta_data->>'lastName',
    new_company_id,
    CASE WHEN new_company_id IS NOT NULL THEN true ELSE false END,
    CASE WHEN new_company_id IS NOT NULL THEN 'admin' ELSE 'member' END,
    100,
    CASE WHEN new_company_id IS NOT NULL THEN 'active' ELSE 'invited' END
  );

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_company_admin(company_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE company_id = $1 
    AND id = auth.uid() 
    AND is_admin = true
    AND status = 'active'
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_company_member(company_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE company_id = $1 
    AND id = auth.uid()
    AND status = 'active'
  );
$function$;

CREATE OR REPLACE FUNCTION public.check_user_is_company_admin_bypass_rls(check_user_id uuid, check_company_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  is_admin boolean := false;
BEGIN
  -- Temporarily disable RLS for this query to avoid recursion
  SET LOCAL row_security = off;
  
  -- Check if user is a company admin (use qualified column names to avoid ambiguity)
  SELECT COALESCE(profiles.is_admin, false) 
  INTO is_admin
  FROM public.profiles 
  WHERE profiles.id = check_user_id AND profiles.company_id = check_company_id AND profiles.status = 'active';
  
  -- Re-enable RLS
  SET LOCAL row_security = on;
  
  RETURN is_admin;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_user_is_team_member_bypass_rls(check_user_id uuid, check_company_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  is_member boolean := false;
BEGIN
  -- Temporarily disable RLS for this query to avoid recursion
  SET LOCAL row_security = off;
  
  -- Check if user is a team member (use qualified column names to avoid ambiguity)
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = check_user_id AND profiles.company_id = check_company_id AND profiles.status = 'active'
  ) INTO is_member;
  
  -- Re-enable RLS
  SET LOCAL row_security = on;
  
  RETURN is_member;
END;
$function$;

CREATE OR REPLACE FUNCTION public.transfer_points_between_users(sender_user_id uuid, recipient_user_id uuid, transfer_company_id uuid, points_amount integer, transfer_description text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  sender_current_points INTEGER;
BEGIN
  -- Validate input parameters
  IF sender_user_id IS NULL OR recipient_user_id IS NULL OR transfer_company_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid input parameters');
  END IF;
  
  IF points_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Points amount must be positive');
  END IF;
  
  IF sender_user_id = recipient_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot transfer points to yourself');
  END IF;
  
  -- Check if both users are members of the company using profiles table
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE company_id = transfer_company_id AND id = sender_user_id AND status = 'active'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sender is not a member of this company');
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE company_id = transfer_company_id AND id = recipient_user_id AND status = 'active'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Recipient is not a member of this company');
  END IF;
  
  -- Get sender's current monthly points (available for giving)
  SELECT monthly_points INTO sender_current_points 
  FROM public.profiles 
  WHERE company_id = transfer_company_id AND id = sender_user_id;
  
  -- Check if sender has enough monthly points
  IF sender_current_points < points_amount THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Insufficient points',
      'current_points', sender_current_points,
      'required_points', points_amount
    );
  END IF;
  
  -- Only create transaction record - let triggers handle point updates to avoid double deduction
  INSERT INTO public.point_transactions (
    company_id, 
    sender_profile_id, 
    recipient_profile_id, 
    points, 
    description
  ) VALUES (
    transfer_company_id,
    sender_user_id,
    recipient_user_id,
    points_amount,
    transfer_description
  );
  
  -- Return success
  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Points transferred successfully',
    'points_transferred', points_amount
  );
  
EXCEPTION WHEN OTHERS THEN
  -- Handle any errors during the transaction
  RETURN jsonb_build_object(
    'success', false, 
    'error', 'Transfer failed: ' || SQLERRM
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_sender_points_before_give()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  -- Check if the sender has enough monthly_points to give
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = NEW.sender_profile_id
    AND monthly_points >= NEW.points
    AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'You do not have enough monthly points to give % points', NEW.points;
  END IF;

  -- Deduct points from the sender's monthly_points balance
  UPDATE public.profiles
  SET monthly_points = monthly_points - NEW.points
  WHERE id = NEW.sender_profile_id;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_member_points()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  -- Add to recognition points (points column) when receiving points
  UPDATE public.profiles
  SET points = points + NEW.points
  WHERE id = NEW.recipient_profile_id
  AND status = 'active';
  RETURN NEW;
END;
$function$;