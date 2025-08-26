-- Insert pricing configuration setting
INSERT INTO platform_settings (key, value, description)
VALUES 
  ('member_monthly_price_cents', '299', 'Monthly price per team member in cents (e.g., 299 = $2.99)')
ON CONFLICT (key) DO NOTHING;