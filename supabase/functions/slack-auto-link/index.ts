import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

function normalizeEmail(email: string): string {
  const [local, domain] = email.toLowerCase().split('@');
  if (!domain) return email.toLowerCase();
  // Strip +alias part
  const normalizedLocal = local.replace(/\+.*$/, '');
  return `${normalizedLocal}@${domain}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the caller
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const userClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get caller's profile to verify admin
    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('company_id, is_admin')
      .eq('id', user.id)
      .single();

    if (!callerProfile?.is_admin || !callerProfile.company_id) {
      return new Response(JSON.stringify({ error: 'Only company admins can link Slack users' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const companyId = callerProfile.company_id;

    // Check for manual link request
    const body = await req.json().catch(() => ({}));

    if (body.action === 'manual_link') {
      const { slack_user_id, profile_id } = body;
      if (!slack_user_id || !profile_id) {
        return new Response(JSON.stringify({ error: 'Missing slack_user_id or profile_id' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Verify profile belongs to same company
      const { data: targetProfile } = await supabase
        .from('profiles')
        .select('id, company_id')
        .eq('id', profile_id)
        .eq('company_id', companyId)
        .single();

      if (!targetProfile) {
        return new Response(JSON.stringify({ error: 'Profile not found in your company' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ slack_user_id })
        .eq('id', profile_id);

      if (updateError) {
        console.error('[SLACK-AUTO-LINK] Manual link error:', updateError);
        return new Response(JSON.stringify({ error: 'Failed to link user' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (body.action === 'unlink') {
      const { profile_id } = body;
      if (!profile_id) {
        return new Response(JSON.stringify({ error: 'Missing profile_id' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ slack_user_id: null })
        .eq('id', profile_id)
        .eq('company_id', companyId);

      if (updateError) {
        console.error('[SLACK-AUTO-LINK] Unlink error:', updateError);
        return new Response(JSON.stringify({ error: 'Failed to unlink user' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Auto-link flow
    // Get Slack integration for this company
    const { data: integration } = await supabase
      .from('slack_integrations')
      .select('bot_token, workspace_name')
      .eq('company_id', companyId)
      .single();

    if (!integration?.bot_token) {
      return new Response(JSON.stringify({ error: 'No Slack integration found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch all Slack workspace users
    let allSlackUsers: any[] = [];
    let cursor: string | undefined;
    do {
      const url = new URL('https://slack.com/api/users.list');
      url.searchParams.set('limit', '200');
      if (cursor) url.searchParams.set('cursor', cursor);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${integration.bot_token}` },
      });
      const data = await res.json();
      if (!data.ok) {
        console.error('[SLACK-AUTO-LINK] Slack API error:', data.error);
        return new Response(JSON.stringify({ error: `Slack API error: ${data.error}` }), {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      allSlackUsers = allSlackUsers.concat(data.members || []);
      cursor = data.response_metadata?.next_cursor;
    } while (cursor);

    // Filter to real users with emails (exclude bots, deleted, slackbot)
    const slackUsersWithEmail = allSlackUsers.filter(
      (m: any) => !m.is_bot && !m.deleted && m.id !== 'USLACKBOT' && m.profile?.email
    );

    console.log(`[SLACK-AUTO-LINK] Found ${slackUsersWithEmail.length} Slack users with emails`);

    // Get all auth users
    const { data: { users: authUsers } } = await supabase.auth.admin.listUsers({ perPage: 1000 });

    // Get all company profiles
    const { data: companyProfiles } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, slack_user_id')
      .eq('company_id', companyId)
      .eq('status', 'active');

    if (!companyProfiles) {
      return new Response(JSON.stringify({ error: 'Failed to fetch profiles' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build normalized email → auth user ID map
    const emailToAuthId = new Map<string, string>();
    for (const u of authUsers) {
      if (u.email) {
        emailToAuthId.set(normalizeEmail(u.email), u.id);
      }
    }

    // Build set of profile IDs in this company
    const profileIdSet = new Set(companyProfiles.map(p => p.id));

    const linked: Array<{ slack_user_id: string; slack_name: string; profile_id: string; profile_name: string }> = [];
    const unlinked: Array<{ slack_user_id: string; slack_name: string; slack_email: string }> = [];
    const alreadyLinked: Array<{ slack_user_id: string; slack_name: string; profile_id: string; profile_name: string }> = [];

    for (const slackUser of slackUsersWithEmail) {
      const slackEmail = slackUser.profile.email;
      const slackName = slackUser.profile.real_name || slackUser.name;
      const slackId = slackUser.id;

      // Check if already linked
      const existingProfile = companyProfiles.find(p => p.slack_user_id === slackId);
      if (existingProfile) {
        alreadyLinked.push({
          slack_user_id: slackId,
          slack_name: slackName,
          profile_id: existingProfile.id,
          profile_name: `${existingProfile.first_name} ${existingProfile.last_name}`,
        });
        continue;
      }

      // Try to match by normalized email
      const normalizedSlackEmail = normalizeEmail(slackEmail);
      const authId = emailToAuthId.get(normalizedSlackEmail);

      if (authId && profileIdSet.has(authId)) {
        // Auto-link
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ slack_user_id: slackId })
          .eq('id', authId)
          .eq('company_id', companyId);

        if (!updateError) {
          const profile = companyProfiles.find(p => p.id === authId);
          linked.push({
            slack_user_id: slackId,
            slack_name: slackName,
            profile_id: authId,
            profile_name: profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown',
          });
        } else {
          console.warn(`[SLACK-AUTO-LINK] Failed to link ${slackId}:`, updateError);
          unlinked.push({ slack_user_id: slackId, slack_name: slackName, slack_email: slackEmail });
        }
      } else {
        unlinked.push({ slack_user_id: slackId, slack_name: slackName, slack_email: slackEmail });
      }
    }

    console.log(`[SLACK-AUTO-LINK] Results: ${linked.length} linked, ${alreadyLinked.length} already linked, ${unlinked.length} unlinked`);

    return new Response(JSON.stringify({ linked, unlinked, already_linked: alreadyLinked }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[SLACK-AUTO-LINK] Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
