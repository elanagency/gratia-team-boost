-- Add company_members columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN company_id uuid REFERENCES public.companies(id),
ADD COLUMN role text NOT NULL DEFAULT 'member',
ADD COLUMN is_admin boolean NOT NULL DEFAULT false,
ADD COLUMN department text,
ADD COLUMN points integer NOT NULL DEFAULT 0,
ADD COLUMN monthly_points integer NOT NULL DEFAULT 0,
ADD COLUMN invitation_status text NOT NULL DEFAULT 'invited',
ADD COLUMN first_login_at timestamp with time zone,
ADD COLUMN temporary_password text;

-- Migrate data from company_members to profiles
UPDATE public.profiles 
SET 
  company_id = cm.company_id,
  role = cm.role,
  is_admin = cm.is_admin,
  department = cm.department,
  points = cm.points,
  monthly_points = cm.monthly_points,
  invitation_status = cm.invitation_status,
  first_login_at = cm.first_login_at,
  temporary_password = cm.temporary_password
FROM public.company_members cm
WHERE profiles.id = cm.profile_id;

-- Update foreign key references in other tables to point to profiles directly
-- Update point_transactions sender_profile_id (already correct)
-- Update point_transactions recipient_profile_id (already correct)

-- Update carts to reference profiles directly instead of company_members
ALTER TABLE public.carts
DROP CONSTRAINT IF EXISTS carts_user_id_fkey,
ADD CONSTRAINT carts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);

-- Update member_monthly_spending to reference profiles directly
ALTER TABLE public.member_monthly_spending
DROP CONSTRAINT IF EXISTS member_monthly_spending_user_id_fkey,
ADD CONSTRAINT member_monthly_spending_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);

-- Update monthly_points_allocations to reference profiles directly
ALTER TABLE public.monthly_points_allocations
DROP CONSTRAINT IF EXISTS monthly_points_allocations_user_id_fkey,
ADD CONSTRAINT monthly_points_allocations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);

-- Update reward_redemptions to reference profiles directly
ALTER TABLE public.reward_redemptions
DROP CONSTRAINT IF EXISTS reward_redemptions_user_id_fkey,
ADD CONSTRAINT reward_redemptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);

-- Update backup_users if needed
ALTER TABLE public.backup_users
DROP CONSTRAINT IF EXISTS backup_users_original_user_id_fkey,
ADD CONSTRAINT backup_users_original_user_id_fkey FOREIGN KEY (original_user_id) REFERENCES public.profiles(id);

-- Drop the company_members table
DROP TABLE IF EXISTS public.company_members CASCADE;

-- Update database functions to work with new schema
CREATE OR REPLACE FUNCTION public.get_company_member_count(company_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT COUNT(*)::INTEGER
  FROM public.profiles
  WHERE company_id = $1 AND is_active = true;
$function$;

CREATE OR REPLACE FUNCTION public.get_used_team_slots(company_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT COUNT(*)::INTEGER
  FROM public.profiles
  WHERE company_id = $1 
    AND is_admin = false 
    AND invitation_status = 'active'
    AND is_active = true;
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
    WHERE id = $1 AND company_id = $2 AND is_active = true
  );
END;
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
    WHERE id = $1 AND company_id = $2 AND is_active = true
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_member_of_company(company_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN public.check_user_company_membership(auth.uid(), $1);
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_company_admin(company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE company_id = $1 
    AND id = auth.uid() 
    AND is_admin = true
    AND is_active = true
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_company_member(company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE company_id = $1 
    AND id = auth.uid()
    AND is_active = true
  );
$function$;

-- Update the monthly points allocation function
CREATE OR REPLACE FUNCTION public.allocate_monthly_points(target_company_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
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
    AND invitation_status = 'active'
    AND is_active = true
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

-- Update triggers to work with profiles table
CREATE OR REPLACE FUNCTION public.update_member_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Add to recognition points (points column) when receiving points
  UPDATE public.profiles
  SET points = points + NEW.points
  WHERE id = NEW.recipient_profile_id;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_sender_points_before_give()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Check if the sender has enough monthly_points to give
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = NEW.sender_profile_id
    AND monthly_points >= NEW.points
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

-- Update the handle_new_user function to work with profiles table
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
    is_active,
    company_id,
    is_admin,
    role,
    monthly_points
  ) VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'firstName',
    NEW.raw_user_meta_data->>'lastName',
    true,
    new_company_id,
    CASE WHEN new_company_id IS NOT NULL THEN true ELSE false END,
    CASE WHEN new_company_id IS NOT NULL THEN 'admin' ELSE 'member' END,
    100
  );

  RETURN NEW;
END;
$function$;

-- Update the clear password trigger
CREATE OR REPLACE FUNCTION public.clear_temporary_password_on_first_login()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Clear temporary password when first_login_at is set (user logs in for the first time)
  IF OLD.first_login_at IS NULL AND NEW.first_login_at IS NOT NULL THEN
    NEW.temporary_password = NULL;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for profiles table
DROP TRIGGER IF EXISTS clear_temporary_password_on_first_login_trigger ON public.profiles;
CREATE TRIGGER clear_temporary_password_on_first_login_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.clear_temporary_password_on_first_login();