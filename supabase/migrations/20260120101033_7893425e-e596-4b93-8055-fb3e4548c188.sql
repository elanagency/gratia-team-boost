-- Create teams_integrations table for Microsoft Teams webhook integration
CREATE TABLE public.teams_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE UNIQUE,
  webhook_url TEXT NOT NULL,
  channel_name TEXT,
  notification_settings JSONB DEFAULT '{
    "recognition_notifications": true,
    "point_allocation_alerts": true,
    "team_milestones": true,
    "weekly_monthly_summaries": true
  }'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.teams_integrations ENABLE ROW LEVEL SECURITY;

-- Policy: Company admins can manage their Teams integration
CREATE POLICY "Company admins can manage Teams integration"
  ON public.teams_integrations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.company_id = teams_integrations.company_id
      AND profiles.is_admin = true
      AND profiles.status = 'active'
    )
  );

-- Policy: Platform admins can view all Teams integrations
CREATE POLICY "Platform admins can view all Teams integrations"
  ON public.teams_integrations
  FOR SELECT
  USING (public.is_platform_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_teams_integrations_updated_at
  BEFORE UPDATE ON public.teams_integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_department_updated_at();