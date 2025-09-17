-- Add new billing fields to companies table
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS billing_ready boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_subscription_item_id text,
ADD COLUMN IF NOT EXISTS first_charge_at timestamp with time zone;