import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { corsHeaders } from '../_shared/cors.ts';

const MS_TEAMS_CLIENT_ID = Deno.env.get('MS_TEAMS_CLIENT_ID')!;
const MS_TEAMS_CLIENT_SECRET = Deno.env.get('MS_TEAMS_CLIENT_SECRET')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify the user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's profile and company
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id, is_admin')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.company_id || !profile.is_admin) {
      return new Response(
        JSON.stringify({ error: 'Only company admins can connect Microsoft Teams' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { code, redirect_uri } = await req.json();

    if (!code || !redirect_uri) {
      return new Response(
        JSON.stringify({ error: 'Missing code or redirect_uri' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[TEAMS-OAUTH] Exchanging code for access token');

    // Exchange code for tokens
    const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: MS_TEAMS_CLIENT_ID,
        client_secret: MS_TEAMS_CLIENT_SECRET,
        code,
        redirect_uri,
        grant_type: 'authorization_code',
        scope: 'Team.ReadBasic.All Channel.ReadBasic.All ChannelMessage.Send offline_access',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || tokenData.error) {
      console.error('[TEAMS-OAUTH] Token exchange failed:', tokenData);
      return new Response(
        JSON.stringify({ error: tokenData.error_description || 'Failed to exchange code for token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[TEAMS-OAUTH] Successfully exchanged code for token');

    // Get user display name from Graph API
    let displayName = 'Microsoft Teams User';
    try {
      const meResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      if (meResponse.ok) {
        const meData = await meResponse.json();
        displayName = meData.displayName || displayName;
      }
    } catch (e) {
      console.warn('[TEAMS-OAUTH] Could not fetch user display name:', e);
    }

    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();

    // Store the integration (upsert on company_id)
    const { error: insertError } = await supabase
      .from('teams_integrations')
      .upsert({
        company_id: profile.company_id,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_expires_at: expiresAt,
        auth_type: 'oauth',
        channel_name: displayName,
        notification_settings: {
          recognition_notifications: true,
          point_allocation_alerts: false,
          team_milestones: false,
          weekly_monthly_summaries: false,
        },
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'company_id',
      });

    if (insertError) {
      console.error('[TEAMS-OAUTH] Failed to store integration:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to store Teams integration' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[TEAMS-OAUTH] Integration stored successfully');

    return new Response(
      JSON.stringify({ success: true, display_name: displayName }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[TEAMS-OAUTH] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
