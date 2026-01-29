-- Create login_events table to track user logins
CREATE TABLE public.login_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  logged_in_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.login_events ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX idx_login_events_company_date 
  ON public.login_events (company_id, logged_in_at);
CREATE INDEX idx_login_events_user 
  ON public.login_events (user_id);

-- RLS Policies
CREATE POLICY "Users can view own login events"
  ON public.login_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Company admins can view company login events"
  ON public.login_events FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.company_id = login_events.company_id
      AND profiles.is_admin = true
      AND profiles.status = 'active'
  ));

CREATE POLICY "Platform admins can view all login events"
  ON public.login_events FOR SELECT
  USING (is_platform_admin());

CREATE POLICY "System can insert login events"
  ON public.login_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);