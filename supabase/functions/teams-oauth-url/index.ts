import { corsHeaders } from '../_shared/cors.ts';

const MS_TEAMS_CLIENT_ID = Deno.env.get('MS_TEAMS_CLIENT_ID');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!MS_TEAMS_CLIENT_ID) {
      return new Response(
        JSON.stringify({ error: 'Microsoft Teams client ID not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { redirect_uri } = await req.json();

    if (!redirect_uri) {
      return new Response(
        JSON.stringify({ error: 'Missing redirect_uri' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const scopes = 'Team.ReadBasic.All Channel.ReadBasic.All ChannelMessage.Send offline_access';

    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${MS_TEAMS_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(redirect_uri)}&scope=${encodeURIComponent(scopes)}&response_mode=query&state=teams`;

    return new Response(
      JSON.stringify({ auth_url: authUrl }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[TEAMS-OAUTH-URL] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
