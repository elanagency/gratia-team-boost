-- Step 1: Add is_active column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN is_active boolean NOT NULL DEFAULT true;

-- Step 2: Drop existing foreign key constraints from related tables
ALTER TABLE public.company_members 
DROP CONSTRAINT IF EXISTS company_members_user_id_fkey;

ALTER TABLE public.point_transactions 
DROP CONSTRAINT IF EXISTS point_transactions_sender_id_fkey;

ALTER TABLE public.point_transactions 
DROP CONSTRAINT IF EXISTS point_transactions_recipient_id_fkey;

-- Step 3: Rename columns to be more explicit about referencing profiles
ALTER TABLE public.company_members 
RENAME COLUMN user_id TO profile_id;

ALTER TABLE public.point_transactions 
RENAME COLUMN sender_id TO sender_profile_id;

ALTER TABLE public.point_transactions 
RENAME COLUMN recipient_id TO recipient_profile_id;

-- Step 4: Add foreign key constraints to profiles table with CASCADE behavior
ALTER TABLE public.company_members 
ADD CONSTRAINT company_members_profile_id_fkey 
FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.point_transactions 
ADD CONSTRAINT point_transactions_sender_profile_id_fkey 
FOREIGN KEY (sender_profile_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.point_transactions 
ADD CONSTRAINT point_transactions_recipient_profile_id_fkey 
FOREIGN KEY (recipient_profile_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Step 5: Drop existing functions before recreating with new parameter names
DROP FUNCTION IF EXISTS public.check_user_company_membership(uuid, uuid);
DROP FUNCTION IF EXISTS public.check_company_membership(uuid, uuid);

-- Step 6: Update the handle_new_user function to work with the new schema
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into profiles with the auth user ID
  INSERT INTO public.profiles (id, first_name, last_name, is_active)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'firstName',
    NEW.raw_user_meta_data->>'lastName',
    true
  );

  -- Create company if provided and add user as admin
  IF NEW.raw_user_meta_data->>'companyName' IS NOT NULL THEN
    WITH new_company AS (
      INSERT INTO public.companies (name)
      VALUES (
        NEW.raw_user_meta_data->>'companyName'
      )
      RETURNING id
    )
    -- Add user as admin of the new company with 100 initial monthly_points
    INSERT INTO public.company_members (company_id, profile_id, is_admin, role, monthly_points)
    SELECT id, NEW.id, TRUE, 'admin', 100 FROM new_company;
  END IF;

  RETURN NEW;
END;
$$;

-- Step 7: Recreate database functions to use profile_id instead of user_id
CREATE OR REPLACE FUNCTION public.check_user_company_membership(profile_id uuid, company_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.company_members 
    WHERE profile_id = $1 AND company_id = $2
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.check_company_membership(profile_id uuid, company_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.company_members
    WHERE company_id = $2 AND profile_id = $1
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_member_of_company(company_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.check_user_company_membership(auth.uid(), $1);
END;
$$;

CREATE OR REPLACE FUNCTION public.is_company_admin(company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM company_members 
    WHERE company_id = $1 
    AND profile_id = auth.uid() 
    AND is_admin = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_company_member(company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM company_members 
    WHERE company_id = $1 
    AND profile_id = auth.uid()
  );
$$;

-- Step 8: Update triggers to use new column names
CREATE OR REPLACE FUNCTION public.update_member_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Add to recognition points (points column) when receiving points
  UPDATE public.company_members
  SET points = points + NEW.points
  WHERE company_id = NEW.company_id AND profile_id = NEW.recipient_profile_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_sender_points_before_give()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the sender has enough monthly_points to give
  IF NOT EXISTS (
    SELECT 1 FROM public.company_members
    WHERE company_id = NEW.company_id 
    AND profile_id = NEW.sender_profile_id
    AND monthly_points >= NEW.points
  ) THEN
    RAISE EXCEPTION 'You do not have enough monthly points to give % points', NEW.points;
  END IF;

  -- Deduct points from the sender's monthly_points balance
  UPDATE public.company_members
  SET monthly_points = monthly_points - NEW.points
  WHERE company_id = NEW.company_id AND profile_id = NEW.sender_profile_id;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_monthly_spending()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_month text := to_char(now(), 'YYYY-MM');
BEGIN
  -- Insert or update monthly spending record
  INSERT INTO public.member_monthly_spending (user_id, company_id, month_year, points_spent)
  VALUES (NEW.sender_profile_id, NEW.company_id, current_month, NEW.points)
  ON CONFLICT (user_id, company_id, month_year)
  DO UPDATE SET 
    points_spent = member_monthly_spending.points_spent + NEW.points,
    updated_at = now();
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.allocate_monthly_points(target_company_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_month TEXT := to_char(now(), 'YYYY-MM');
  allocation_count INTEGER := 0;
  member_record RECORD;
BEGIN
  -- Reset monthly_points to 100 for all active company members (admin and non-admin)
  FOR member_record IN 
    SELECT profile_id FROM public.company_members 
    WHERE company_id = target_company_id
    AND invitation_status = 'active'
  LOOP
    -- Check if allocation already exists for this month
    IF NOT EXISTS (
      SELECT 1 FROM public.monthly_points_allocations 
      WHERE company_id = target_company_id 
      AND user_id = member_record.profile_id 
      AND allocation_month = current_month
    ) THEN
      -- Insert allocation record
      INSERT INTO public.monthly_points_allocations (
        company_id, user_id, points_allocated, allocation_month
      ) VALUES (
        target_company_id, member_record.profile_id, 100, current_month
      );
      
      -- Reset member's monthly_points to 100
      UPDATE public.company_members 
      SET monthly_points = 100
      WHERE company_id = target_company_id 
      AND profile_id = member_record.profile_id;
      
      allocation_count := allocation_count + 1;
    END IF;
  END LOOP;
  
  RETURN allocation_count;
END;
$$;