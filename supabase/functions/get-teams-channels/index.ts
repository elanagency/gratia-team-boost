import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { corsHeaders } from '../_shared/cors.ts';
import { getValidAccessToken } from '../_shared/teams-auth.ts';

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

    // Get user's company
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      return new Response(
        JSON.stringify({ error: 'No company found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get valid access token (auto-refreshes if needed)
    const { access_token } = await getValidAccessToken(supabase, profile.company_id);

    // Optionally get channels for a specific team
    const url = new URL(req.url);
    const teamId = url.searchParams.get('team_id');

    const graphHeaders = { Authorization: `Bearer ${access_token}` };

    if (teamId) {
      // Fetch channels for a specific team
      const channelsRes = await fetch(
        `https://graph.microsoft.com/v1.0/teams/${teamId}/channels`,
        { headers: graphHeaders }
      );
      
      if (!channelsRes.ok) {
        const errData = await channelsRes.json();
        console.error('[GET-TEAMS-CHANNELS] Channels fetch error:', errData);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch channels' }),
          { status: channelsRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const channelsData = await channelsRes.json();
      return new Response(
        JSON.stringify({ channels: channelsData.value }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch joined teams
    const teamsRes = await fetch(
      'https://graph.microsoft.com/v1.0/me/joinedTeams',
      { headers: graphHeaders }
    );

    if (!teamsRes.ok) {
      const errData = await teamsRes.json();
      console.error('[GET-TEAMS-CHANNELS] Teams fetch error:', errData);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch teams' }),
        { status: teamsRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const teamsData = await teamsRes.json();
    return new Response(
      JSON.stringify({ teams: teamsData.value }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[GET-TEAMS-CHANNELS] Error:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
