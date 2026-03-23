import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    // Verify admin
    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('company_id, is_admin')
      .eq('id', user.id)
      .single();

    if (!callerProfile?.is_admin || !callerProfile.company_id) {
      return new Response(JSON.stringify({ error: 'Only company admins can list Slack members' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const companyId = callerProfile.company_id;

    // Get Slack integration
    const { data: integration } = await supabase
      .from('slack_integrations')
      .select('bot_token')
      .eq('company_id', companyId)
      .single();

    if (!integration?.bot_token) {
      return new Response(JSON.stringify({ error: 'No Slack integration found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch all Slack workspace users (paginated)
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
        console.error('[SLACK-LIST-MEMBERS] Slack API error:', data.error);
        return new Response(JSON.stringify({ error: `Slack API error: ${data.error}` }), {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      allSlackUsers = allSlackUsers.concat(data.members || []);
      cursor = data.response_metadata?.next_cursor;
    } while (cursor);

    // Filter to real users with emails
    const slackUsersWithEmail = allSlackUsers.filter(
      (m: any) => !m.is_bot && !m.deleted && m.id !== 'USLACKBOT' && m.profile?.email
    );

    console.log(`[SLACK-LIST-MEMBERS] Found ${slackUsersWithEmail.length} Slack users with emails`);

    // Get all company profiles
    const { data: companyProfiles } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, slack_user_id, status')
      .eq('company_id', companyId);

    // Get auth users to match by email
    const { data: { users: authUsers } } = await supabase.auth.admin.listUsers({ perPage: 1000 });

    // Build email → profile mapping
    const emailToProfile = new Map<string, { id: string; first_name: string; last_name: string; slack_user_id: string | null; status: string }>();
    for (const profile of (companyProfiles || [])) {
      const authUser = authUsers.find(u => u.id === profile.id);
      if (authUser?.email) {
        emailToProfile.set(authUser.email.toLowerCase(), profile);
      }
    }

    // Build slack_user_id → profile mapping
    const slackIdToProfile = new Map<string, typeof companyProfiles extends (infer T)[] | null ? T : never>();
    for (const profile of (companyProfiles || [])) {
      if (profile.slack_user_id) {
        slackIdToProfile.set(profile.slack_user_id, profile);
      }
    }

    // Classify each Slack user
    const members = slackUsersWithEmail.map((slackUser: any) => {
      const slackEmail = slackUser.profile.email;
      const slackName = slackUser.profile.real_name || slackUser.name;
      const slackId = slackUser.id;
      const avatarUrl = slackUser.profile.image_72 || slackUser.profile.image_48 || null;

      // Check if already linked by slack_user_id
      const linkedProfile = slackIdToProfile.get(slackId);
      if (linkedProfile) {
        return {
          slack_user_id: slackId,
          name: slackName,
          email: slackEmail,
          avatar_url: avatarUrl,
          status: 'already_linked' as const,
          profile_name: `${linkedProfile.first_name} ${linkedProfile.last_name}`,
        };
      }

      // Check if email matches an existing company member
      const emailProfile = emailToProfile.get(slackEmail.toLowerCase());
      if (emailProfile) {
        return {
          slack_user_id: slackId,
          name: slackName,
          email: slackEmail,
          avatar_url: avatarUrl,
          status: 'already_member' as const,
          profile_name: `${emailProfile.first_name} ${emailProfile.last_name}`,
        };
      }

      // Available to invite
      return {
        slack_user_id: slackId,
        name: slackName,
        email: slackEmail,
        avatar_url: avatarUrl,
        status: 'available' as const,
        profile_name: null,
      };
    });

    const available = members.filter((m: any) => m.status === 'available').length;
    const alreadyMember = members.filter((m: any) => m.status === 'already_member').length;
    const alreadyLinked = members.filter((m: any) => m.status === 'already_linked').length;

    console.log(`[SLACK-LIST-MEMBERS] Results: ${available} available, ${alreadyMember} already_member, ${alreadyLinked} already_linked`);

    return new Response(JSON.stringify({ members }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[SLACK-LIST-MEMBERS] Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
