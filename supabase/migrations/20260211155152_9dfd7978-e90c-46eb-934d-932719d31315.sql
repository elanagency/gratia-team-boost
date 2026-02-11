
-- Add celebration reward settings to companies
ALTER TABLE public.companies
ADD COLUMN birthday_rewards_enabled boolean NOT NULL DEFAULT false,
ADD COLUMN birthday_reward_points integer NOT NULL DEFAULT 0,
ADD COLUMN anniversary_rewards_enabled boolean NOT NULL DEFAULT false,
ADD COLUMN anniversary_reward_points integer NOT NULL DEFAULT 0;

-- Create celebration rewards log table
CREATE TABLE public.celebration_rewards_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reward_type text NOT NULL CHECK (reward_type IN ('birthday', 'anniversary')),
  points_awarded integer NOT NULL,
  event_date date NOT NULL,
  year integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Unique constraint to prevent double-awarding
ALTER TABLE public.celebration_rewards_log
ADD CONSTRAINT unique_celebration_per_year UNIQUE (company_id, profile_id, reward_type, year);

-- Enable RLS
ALTER TABLE public.celebration_rewards_log ENABLE ROW LEVEL SECURITY;

-- Company admins can view their company's celebration logs
CREATE POLICY "Company admins can view celebration logs"
ON public.celebration_rewards_log
FOR SELECT
USING (public.is_company_admin(company_id));

-- Platform admins can view all celebration logs
CREATE POLICY "Platform admins can view all celebration logs"
ON public.celebration_rewards_log
FOR SELECT
USING (public.is_platform_admin(auth.uid()));

-- Only service role (edge functions) can insert celebration logs
CREATE POLICY "Service role can insert celebration logs"
ON public.celebration_rewards_log
FOR INSERT
WITH CHECK (true);

-- Index for daily processing query
CREATE INDEX idx_celebration_rewards_log_company_year
ON public.celebration_rewards_log (company_id, year, reward_type);
