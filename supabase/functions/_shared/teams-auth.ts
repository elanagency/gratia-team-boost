import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const MS_TEAMS_CLIENT_ID = Deno.env.get('MS_TEAMS_CLIENT_ID')!;
const MS_TEAMS_CLIENT_SECRET = Deno.env.get('MS_TEAMS_CLIENT_SECRET')!;

interface TokenResult {
  access_token: string;
  refreshed: boolean;
}

/**
 * Get a valid access token for a company's Teams integration.
 * Automatically refreshes if expired.
 */
export async function getValidAccessToken(
  supabase: ReturnType<typeof createClient>,
  companyId: string
): Promise<TokenResult> {
  const { data: integration, error } = await supabase
    .from('teams_integrations')
    .select('id, access_token, refresh_token, token_expires_at')
    .eq('company_id', companyId)
    .eq('auth_type', 'oauth')
    .single();

  if (error || !integration) {
    throw new Error('No OAuth Teams integration found for this company');
  }

  const { access_token, refresh_token, token_expires_at } = integration;

  if (!access_token || !refresh_token) {
    throw new Error('Missing OAuth tokens');
  }

  // Check if token is expired (with 5 min buffer)
  const expiresAt = new Date(token_expires_at).getTime();
  const now = Date.now();
  const bufferMs = 5 * 60 * 1000;

  if (now < expiresAt - bufferMs) {
    return { access_token, refreshed: false };
  }

  // Refresh the token
  console.log('[TEAMS-AUTH] Refreshing expired access token');
  const newTokens = await refreshAccessToken(refresh_token);

  // Update in database
  const expiresAtDate = new Date(Date.now() + newTokens.expires_in * 1000).toISOString();
  await supabase
    .from('teams_integrations')
    .update({
      access_token: newTokens.access_token,
      refresh_token: newTokens.refresh_token || refresh_token,
      token_expires_at: expiresAtDate,
    })
    .eq('id', integration.id);

  return { access_token: newTokens.access_token, refreshed: true };
}

/**
 * Refresh an access token using the refresh token.
 */
async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}> {
  const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: MS_TEAMS_CLIENT_ID,
      client_secret: MS_TEAMS_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      scope: 'Team.ReadBasic.All Channel.ReadBasic.All ChannelMessage.Send offline_access',
    }),
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    console.error('[TEAMS-AUTH] Token refresh failed:', data);
    throw new Error(data.error_description || 'Failed to refresh token');
  }

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
  };
}
