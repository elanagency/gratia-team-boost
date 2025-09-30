-- Create slack_integrations table to store Slack workspace connections
CREATE TABLE public.slack_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  workspace_id TEXT NOT NULL,
  workspace_name TEXT NOT NULL,
  access_token TEXT NOT NULL,
  bot_token TEXT NOT NULL,
  default_channel_id TEXT,
  default_channel_name TEXT,
  notification_settings JSONB DEFAULT '{
    "recognition_notifications": true,
    "point_allocation_alerts": true,
    "team_milestones": true,
    "weekly_monthly_summaries": true
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id)
);

-- Enable Row Level Security
ALTER TABLE public.slack_integrations ENABLE ROW LEVEL SECURITY;

-- Company admins can view their own Slack integration
CREATE POLICY "Company admins can view their Slack integration"
ON public.slack_integrations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.company_id = slack_integrations.company_id
    AND profiles.is_admin = true
    AND profiles.status = 'active'
  )
);

-- Company admins can insert their Slack integration
CREATE POLICY "Company admins can insert their Slack integration"
ON public.slack_integrations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.company_id = slack_integrations.company_id
    AND profiles.is_admin = true
    AND profiles.status = 'active'
  )
);

-- Company admins can update their Slack integration
CREATE POLICY "Company admins can update their Slack integration"
ON public.slack_integrations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.company_id = slack_integrations.company_id
    AND profiles.is_admin = true
    AND profiles.status = 'active'
  )
);

-- Company admins can delete their Slack integration
CREATE POLICY "Company admins can delete their Slack integration"
ON public.slack_integrations
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.company_id = slack_integrations.company_id
    AND profiles.is_admin = true
    AND profiles.status = 'active'
  )
);

-- Platform admins can manage all Slack integrations
CREATE POLICY "Platform admins can manage all Slack integrations"
ON public.slack_integrations
FOR ALL
USING (is_platform_admin())
WITH CHECK (is_platform_admin());

-- Create trigger for updated_at
CREATE TRIGGER update_slack_integrations_updated_at
BEFORE UPDATE ON public.slack_integrations
FOR EACH ROW
EXECUTE FUNCTION public.update_department_updated_at();