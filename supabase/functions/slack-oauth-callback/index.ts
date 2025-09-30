import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { corsHeaders } from '../_shared/cors.ts';

const SLACK_CLIENT_ID = Deno.env.get('SLACK_CLIENT_ID');
const SLACK_CLIENT_SECRET = Deno.env.get('SLACK_CLIENT_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the user
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
        JSON.stringify({ error: 'Only company admins can connect Slack' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { code, redirect_uri } = await req.json();

    if (!code) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization code' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!redirect_uri) {
      return new Response(
        JSON.stringify({ error: 'Missing redirect_uri' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[SLACK-OAUTH] Exchanging code for access token');

    // Exchange code for access token
    const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: SLACK_CLIENT_ID!,
        client_secret: SLACK_CLIENT_SECRET!,
        code,
        redirect_uri,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.ok) {
      console.error('[SLACK-OAUTH] Token exchange failed:', tokenData);
      return new Response(
        JSON.stringify({ error: tokenData.error || 'Failed to exchange code for token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[SLACK-OAUTH] Successfully exchanged code for token');

    // Store the integration
    const { error: insertError } = await supabase
      .from('slack_integrations')
      .upsert({
        company_id: profile.company_id,
        workspace_id: tokenData.team.id,
        workspace_name: tokenData.team.name,
        access_token: tokenData.access_token,
        bot_token: tokenData.access_token, // In OAuth v2, this is the same
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'company_id',
      });

    if (insertError) {
      console.error('[SLACK-OAUTH] Failed to store integration:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to store Slack integration' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[SLACK-OAUTH] Integration stored successfully');

    return new Response(
      JSON.stringify({
        success: true,
        workspace_name: tokenData.team.name,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[SLACK-OAUTH] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});