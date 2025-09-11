-- Update the handle_new_user function to set proper invitation_status
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
    monthly_points,
    invitation_status
  ) VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'firstName',
    NEW.raw_user_meta_data->>'lastName',
    true,
    new_company_id,
    CASE WHEN new_company_id IS NOT NULL THEN true ELSE false END,
    CASE WHEN new_company_id IS NOT NULL THEN 'admin' ELSE 'member' END,
    100,
    CASE WHEN new_company_id IS NOT NULL THEN 'active' ELSE 'invited' END
  );

  RETURN NEW;
END;
$function$;

-- Update the existing user to have active status so they can access their points
UPDATE public.profiles 
SET invitation_status = 'active' 
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'vaxohom973@knilok.com'
);