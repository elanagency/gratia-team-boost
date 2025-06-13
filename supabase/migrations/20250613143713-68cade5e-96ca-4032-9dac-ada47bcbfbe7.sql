
-- Make the handle column nullable and update the trigger to not require it
ALTER TABLE public.companies ALTER COLUMN handle DROP NOT NULL;

-- Update the handle_new_user function to not require a company handle
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (id, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'firstName',
    NEW.raw_user_meta_data->>'lastName'
  );

  -- Create company if provided (without requiring handle)
  IF NEW.raw_user_meta_data->>'companyName' IS NOT NULL THEN
    WITH new_company AS (
      INSERT INTO public.companies (name)
      VALUES (
        NEW.raw_user_meta_data->>'companyName'
      )
      RETURNING id
    )
    -- Add user as admin of the new company
    INSERT INTO public.company_members (company_id, user_id, is_admin, role)
    SELECT id, NEW.id, TRUE, 'admin' FROM new_company;
  END IF;

  RETURN NEW;
END;
$function$;
