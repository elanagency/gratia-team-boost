-- Update handle_new_user to give monthly_points instead of recognition points
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (id, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'firstName',
    NEW.raw_user_meta_data->>'lastName'
  );

  -- Create company if provided and add user as admin with 100 monthly_points
  IF NEW.raw_user_meta_data->>'companyName' IS NOT NULL THEN
    WITH new_company AS (
      INSERT INTO public.companies (name)
      VALUES (
        NEW.raw_user_meta_data->>'companyName'
      )
      RETURNING id
    )
    -- Add user as admin of the new company with 100 initial monthly_points
    INSERT INTO public.company_members (company_id, user_id, is_admin, role, monthly_points)
    SELECT id, NEW.id, TRUE, 'admin', 100 FROM new_company;
  END IF;

  RETURN NEW;
END;
$$;

-- Update should_allocate_monthly_points to always allocate on day 1 regardless of billing anchor
CREATE OR REPLACE FUNCTION public.should_allocate_monthly_points(target_company_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_day INTEGER := EXTRACT(DAY FROM now());
  current_month TEXT := to_char(now(), 'YYYY-MM');
  has_allocation BOOLEAN;
BEGIN
  -- Check if it's the 1st day of the month
  IF current_day != 1 THEN
    RETURN FALSE;
  END IF;
  
  -- Check if allocation already done this month
  SELECT EXISTS (
    SELECT 1 FROM public.monthly_points_allocations 
    WHERE company_id = target_company_id 
    AND allocation_month = current_month
  ) INTO has_allocation;
  
  RETURN NOT has_allocation;
END;
$$;

-- Update allocate_monthly_points to reset monthly_points to 100 instead of adding
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
    SELECT user_id FROM public.company_members 
    WHERE company_id = target_company_id
    AND invitation_status = 'active'
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
      
      -- Reset member's monthly_points to 100
      UPDATE public.company_members 
      SET monthly_points = 100
      WHERE company_id = target_company_id 
      AND user_id = member_record.user_id;
      
      allocation_count := allocation_count + 1;
    END IF;
  END LOOP;
  
  RETURN allocation_count;
END;
$$;