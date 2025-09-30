import { corsHeaders } from '../_shared/cors.ts';

const SLACK_CLIENT_ID = Deno.env.get('SLACK_CLIENT_ID');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!SLACK_CLIENT_ID) {
      return new Response(
        JSON.stringify({ error: 'Slack client ID not configured' }),
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

    const slackAuthUrl = `https://slack.com/oauth/v2/authorize?client_id=${SLACK_CLIENT_ID}&scope=chat:write,channels:read,groups:read&redirect_uri=${encodeURIComponent(redirect_uri)}`;

    return new Response(
      JSON.stringify({ auth_url: slackAuthUrl }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[SLACK-OAUTH-URL] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});