-- Create a function to clear temporary password on first login
CREATE OR REPLACE FUNCTION public.clear_temporary_password_on_first_login()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Clear temporary password when first_login_at is set (user logs in for the first time)
  IF OLD.first_login_at IS NULL AND NEW.first_login_at IS NOT NULL THEN
    NEW.temporary_password = NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically clear temporary password on first login
CREATE TRIGGER clear_temp_password_on_first_login
  BEFORE UPDATE ON public.company_members
  FOR EACH ROW
  EXECUTE FUNCTION public.clear_temporary_password_on_first_login();