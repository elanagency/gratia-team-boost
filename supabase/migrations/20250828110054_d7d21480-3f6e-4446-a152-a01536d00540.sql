-- Create monthly points allocations tracking table
CREATE TABLE public.monthly_points_allocations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  user_id UUID NOT NULL,
  points_allocated INTEGER NOT NULL DEFAULT 100,
  allocation_month TEXT NOT NULL, -- Format: YYYY-MM
  allocation_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.monthly_points_allocations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Company admins can view allocations" 
ON public.monthly_points_allocations 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.company_members 
  WHERE company_id = monthly_points_allocations.company_id 
  AND user_id = auth.uid() 
  AND is_admin = true
));

CREATE POLICY "Platform admins can view all allocations" 
ON public.monthly_points_allocations 
FOR SELECT 
USING (is_platform_admin());

CREATE POLICY "System can insert allocations" 
ON public.monthly_points_allocations 
FOR INSERT 
WITH CHECK (true);

-- Create unique constraint to prevent duplicate allocations
CREATE UNIQUE INDEX idx_unique_monthly_allocation 
ON public.monthly_points_allocations (company_id, user_id, allocation_month);

-- Update handle_new_user function to give 100 points to new admins
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (id, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'firstName',
    NEW.raw_user_meta_data->>'lastName'
  );

  -- Create company if provided and add user as admin with 100 points
  IF NEW.raw_user_meta_data->>'companyName' IS NOT NULL THEN
    WITH new_company AS (
      INSERT INTO public.companies (name)
      VALUES (
        NEW.raw_user_meta_data->>'companyName'
      )
      RETURNING id
    )
    -- Add user as admin of the new company with 100 initial points
    INSERT INTO public.company_members (company_id, user_id, is_admin, role, points)
    SELECT id, NEW.id, TRUE, 'admin', 100 FROM new_company;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Create function to allocate monthly points
CREATE OR REPLACE FUNCTION public.allocate_monthly_points(target_company_id UUID)
RETURNS INTEGER AS $$
DECLARE
  current_month TEXT := to_char(now(), 'YYYY-MM');
  allocation_count INTEGER := 0;
  member_record RECORD;
BEGIN
  -- Allocate 100 points to all company members (admin and non-admin)
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
      
      -- Add points to member
      UPDATE public.company_members 
      SET points = points + 100
      WHERE company_id = target_company_id 
      AND user_id = member_record.user_id;
      
      allocation_count := allocation_count + 1;
    END IF;
  END LOOP;
  
  RETURN allocation_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if company needs monthly allocation
CREATE OR REPLACE FUNCTION public.should_allocate_monthly_points(target_company_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  billing_anchor INTEGER;
  current_day INTEGER := EXTRACT(DAY FROM now());
  current_month TEXT := to_char(now(), 'YYYY-MM');
  has_allocation BOOLEAN;
BEGIN
  -- Get company billing cycle anchor
  SELECT billing_cycle_anchor INTO billing_anchor
  FROM public.companies 
  WHERE id = target_company_id;
  
  -- If no billing anchor set, use day 1 of month
  IF billing_anchor IS NULL THEN
    billing_anchor := 1;
  END IF;
  
  -- Check if it's the billing day
  IF current_day != billing_anchor THEN
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
$$ LANGUAGE plpgsql SECURITY DEFINER;