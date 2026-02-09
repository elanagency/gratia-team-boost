
-- Add OAuth columns to teams_integrations for Microsoft Graph API support
ALTER TABLE public.teams_integrations
  ADD COLUMN IF NOT EXISTS access_token text,
  ADD COLUMN IF NOT EXISTS refresh_token text,
  ADD COLUMN IF NOT EXISTS token_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS team_id text,
  ADD COLUMN IF NOT EXISTS team_name text,
  ADD COLUMN IF NOT EXISTS channel_id text,
  ADD COLUMN IF NOT EXISTS auth_type text NOT NULL DEFAULT 'webhook';

-- Make webhook_url nullable for OAuth connections
ALTER TABLE public.teams_integrations
  ALTER COLUMN webhook_url DROP NOT NULL;
