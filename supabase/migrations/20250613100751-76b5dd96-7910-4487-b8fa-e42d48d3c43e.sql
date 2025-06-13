
-- Add is_default column to platform_payment_methods table
ALTER TABLE public.platform_payment_methods 
ADD COLUMN is_default BOOLEAN NOT NULL DEFAULT false;

-- Create index for better performance on default lookup
CREATE INDEX idx_platform_payment_methods_default ON public.platform_payment_methods(is_default) WHERE is_default = true;

-- Create a function to ensure only one default payment method exists
CREATE OR REPLACE FUNCTION ensure_single_default_payment_method()
RETURNS TRIGGER AS $$
BEGIN
  -- If this payment method is being set as default
  IF NEW.is_default = true THEN
    -- Set all other payment methods to not default
    UPDATE public.platform_payment_methods 
    SET is_default = false 
    WHERE id != NEW.id AND status = 'active';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to maintain single default
CREATE TRIGGER trigger_ensure_single_default_payment_method
  BEFORE INSERT OR UPDATE ON public.platform_payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_payment_method();
