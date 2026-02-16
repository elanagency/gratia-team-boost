UPDATE companies
SET billing_ready = false, updated_at = now()
WHERE billing_ready = true
  AND stripe_subscription_id IS NULL;