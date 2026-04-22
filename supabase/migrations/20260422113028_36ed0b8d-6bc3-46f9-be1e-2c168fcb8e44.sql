ALTER TABLE public.celebration_rewards_log
  ADD COLUMN IF NOT EXISTS dollar_amount NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS stripe_invoice_item_id TEXT,
  ADD COLUMN IF NOT EXISTS billing_status TEXT NOT NULL DEFAULT 'pending';

CREATE INDEX IF NOT EXISTS idx_celebration_rewards_log_billing_status
  ON public.celebration_rewards_log(company_id, billing_status);