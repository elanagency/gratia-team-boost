-- Add separate Stripe customer ID columns for live and test environments
ALTER TABLE public.companies 
ADD COLUMN stripe_customer_id_live TEXT,
ADD COLUMN stripe_customer_id_test TEXT;

-- Migrate existing stripe_customer_id values to the live environment column
-- (assuming most existing customers were created in live mode)
UPDATE public.companies 
SET stripe_customer_id_live = stripe_customer_id 
WHERE stripe_customer_id IS NOT NULL AND environment = 'live';

UPDATE public.companies 
SET stripe_customer_id_test = stripe_customer_id 
WHERE stripe_customer_id IS NOT NULL AND environment = 'test';

-- Add indexes for better performance
CREATE INDEX idx_companies_stripe_customer_id_live ON public.companies(stripe_customer_id_live);
CREATE INDEX idx_companies_stripe_customer_id_test ON public.companies(stripe_customer_id_test);