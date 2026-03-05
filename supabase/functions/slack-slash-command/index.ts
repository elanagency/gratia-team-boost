import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SLACK_SIGNING_SECRET = Deno.env.get('SLACK_SIGNING_SECRET')!;

async function verifySlackSignature(req: Request, body: string): Promise<boolean> {
  const timestamp = req.headers.get('x-slack-request-timestamp');
  const slackSignature = req.headers.get('x-slack-signature');

  if (!timestamp || !slackSignature) return false;

  // Reject requests older than 5 minutes
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp)) > 300) return false;

  const sigBasestring = `v0:${timestamp}:${body}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(SLACK_SIGNING_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(sigBasestring));
  const hex = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const computedSignature = `v0=${hex}`;

  return computedSignature === slackSignature;
}

function parseCommandText(text: string): { slackUserId: string | null; points: number; message: string } | null {
  // Expected formats:
  // <@U12345|username> 50 Great job!
  // <@U12345> 50 Great job!
  // @username 50 Great job!
  const trimmed = text.trim();
  if (!trimmed) return null;

  // Try to match Slack's encoded mention format: <@U12345|username> or <@U12345>
  const encodedMentionMatch = trimmed.match(/^<@([A-Z0-9]+)(?:\|[^>]*)?>[\s]+(\d+)[\s]+([\s\S]+)$/);
  if (encodedMentionMatch) {
    return {
      slackUserId: encodedMentionMatch[1],
      points: parseInt(encodedMentionMatch[2], 10),
      message: encodedMentionMatch[3].trim(),
    };
  }

  // Fallback: @username points message
  const plainMentionMatch = trimmed.match(/^@(\S+)[\s]+(\d+)[\s]+([\s\S]+)$/);
  if (plainMentionMatch) {
    // We'll resolve username to ID later
    return {
      slackUserId: null, // will need username lookup
      points: parseInt(plainMentionMatch[2], 10),
      message: plainMentionMatch[3].trim(),
    };
  }

  return null;
}

function normalizeEmail(email: string): string {
  const [local, domain] = email.toLowerCase().split('@');
  if (!domain) return email.toLowerCase();
  return `${local.replace(/\+.*$/, '')}@${domain}`;
}

async function getSlackUserEmail(botToken: string, slackUserId: string): Promise<string | null> {
  const res = await fetch(`https://slack.com/api/users.info?user=${slackUserId}`, {
    headers: { Authorization: `Bearer ${botToken}` },
  });
  const data = await res.json();
  if (!data.ok || !data.user?.profile?.email) return null;
  return data.user.profile.email;
}

async function lookupSlackUserByUsername(botToken: string, username: string): Promise<string | null> {
  // List workspace users and find by display name or real name
  // This is a fallback — encoded mentions are preferred
  const res = await fetch('https://slack.com/api/users.list?limit=500', {
    headers: { Authorization: `Bearer ${botToken}` },
  });
  const data = await res.json();
  if (!data.ok) return null;

  const user = data.members?.find(
    (m: any) =>
      m.name === username ||
      m.profile?.display_name === username ||
      m.profile?.display_name_normalized === username
  );
  return user?.id || null;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const body = await req.text();

  // Verify Slack signature
  const isValid = await verifySlackSignature(req, body);
  if (!isValid) {
    console.error('[SLACK-SLASH-COMMAND] Invalid signature');
    return new Response('Invalid signature', { status: 401 });
  }

  // Parse form-encoded body
  const params = new URLSearchParams(body);
  const teamId = params.get('team_id');
  const senderSlackUserId = params.get('user_id');
  const text = params.get('text') || '';
  const channelId = params.get('channel_id');

  console.log('[SLACK-SLASH-COMMAND] Received command:', { teamId, senderSlackUserId, text });

  if (!teamId || !senderSlackUserId) {
    return new Response(
      JSON.stringify({ response_type: 'ephemeral', text: '❌ Invalid request from Slack.' }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Parse the command text
  const parsed = parseCommandText(text);
  if (!parsed) {
    return new Response(
      JSON.stringify({
        response_type: 'ephemeral',
        text: '❌ Usage: `/grattia @user [points] [message]`\nExample: `/grattia @john 50 Amazing teamwork on the project!`',
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (parsed.points <= 0) {
    return new Response(
      JSON.stringify({ response_type: 'ephemeral', text: '❌ Points must be a positive number.' }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // 1. Look up the company via workspace_id (team_id in Slack)
    const { data: integration, error: integrationError } = await supabase
      .from('slack_integrations')
      .select('company_id, bot_token')
      .eq('workspace_id', teamId)
      .single();

    if (integrationError || !integration) {
      console.error('[SLACK-SLASH-COMMAND] No integration found for team:', teamId);
      return new Response(
        JSON.stringify({ response_type: 'ephemeral', text: '❌ Grattia is not connected to this Slack workspace.' }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { company_id, bot_token } = integration;

    // 2. Resolve recipient Slack user ID
    let recipientSlackUserId = parsed.slackUserId;
    if (!recipientSlackUserId) {
      // Fallback: text had @username without encoding — try to resolve
      const usernameMatch = text.trim().match(/^@(\S+)/);
      if (usernameMatch) {
        recipientSlackUserId = await lookupSlackUserByUsername(bot_token, usernameMatch[1]);
      }
      if (!recipientSlackUserId) {
        return new Response(
          JSON.stringify({ response_type: 'ephemeral', text: '❌ Could not find that user. Try mentioning them with @.' }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // 3. Try to resolve profiles by slack_user_id first (fast path)
    const { data: slackLinkedProfiles } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, monthly_points, company_id, slack_user_id')
      .eq('company_id', company_id)
      .in('slack_user_id', [senderSlackUserId, recipientSlackUserId]);

    let senderProfile = slackLinkedProfiles?.find((p) => p.slack_user_id === senderSlackUserId);
    let recipientProfile = slackLinkedProfiles?.find((p) => p.slack_user_id === recipientSlackUserId);

    // Fallback: email-based lookup with normalization for any unresolved users
    if (!senderProfile || !recipientProfile) {
      const missingSlackIds: string[] = [];
      if (!senderProfile) missingSlackIds.push(senderSlackUserId);
      if (!recipientProfile) missingSlackIds.push(recipientSlackUserId);

      const emailPromises = missingSlackIds.map((id) => getSlackUserEmail(bot_token, id));
      const emails = await Promise.all(emailPromises);

      const senderEmail = !senderProfile ? emails[0] : null;
      const recipientEmail = !recipientProfile ? emails[missingSlackIds.indexOf(recipientSlackUserId)] : null;

      if (!senderProfile) {
        if (!senderEmail) {
          return new Response(
            JSON.stringify({ response_type: 'ephemeral', text: '❌ Could not find your email in Slack. Make sure your Slack profile has an email, or ask your admin to link your account in Settings.' }),
            { headers: { 'Content-Type': 'application/json' } }
          );
        }
        // Normalize and match
        const { data: { users: allUsers } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
        const normalizedSenderEmail = normalizeEmail(senderEmail);
        const senderAuthUser = allUsers.find((u) => u.email && normalizeEmail(u.email) === normalizedSenderEmail);
        if (senderAuthUser) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, monthly_points, company_id, slack_user_id')
            .eq('id', senderAuthUser.id)
            .eq('company_id', company_id)
            .single();
          senderProfile = profile;
        }
      }

      if (!recipientProfile) {
        if (!recipientEmail) {
          return new Response(
            JSON.stringify({ response_type: 'ephemeral', text: '❌ Could not find that user\'s email in Slack. Ask your admin to link their account in Settings.' }),
            { headers: { 'Content-Type': 'application/json' } }
          );
        }
        const { data: { users: allUsers } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
        const normalizedRecipientEmail = normalizeEmail(recipientEmail);
        const recipientAuthUser = allUsers.find((u) => u.email && normalizeEmail(u.email) === normalizedRecipientEmail);
        if (recipientAuthUser) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, monthly_points, company_id, slack_user_id')
            .eq('id', recipientAuthUser.id)
            .eq('company_id', company_id)
            .single();
          recipientProfile = profile;
        }
      }
    }

    if (!senderProfile) {
      return new Response(
        JSON.stringify({ response_type: 'ephemeral', text: '❌ Your Grattia account could not be found. Ask your admin to link your Slack account in Settings.' }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!recipientProfile) {
      return new Response(
        JSON.stringify({ response_type: 'ephemeral', text: '❌ That user is not linked to a Grattia account. Ask your admin to link their account in Settings.' }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 6. Transfer points via RPC
    const { data: result, error: rpcError } = await supabase.rpc('transfer_points_between_users', {
      sender_user_id: senderProfile.id,
      recipient_user_id: recipientProfile.id,
      transfer_company_id: company_id,
      points_amount: parsed.points,
      transfer_description: parsed.message,
    });

    if (rpcError) {
      console.error('[SLACK-SLASH-COMMAND] RPC error:', rpcError);
      return new Response(
        JSON.stringify({ response_type: 'ephemeral', text: '❌ Something went wrong transferring points. Please try again.' }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    const transferResult = result as { success: boolean; error?: string; current_points?: number };

    if (!transferResult.success) {
      let errorMsg = transferResult.error || 'Transfer failed.';
      if (errorMsg.includes('Insufficient points')) {
        errorMsg = `You only have ${transferResult.current_points ?? 0} points available this month.`;
      } else if (errorMsg.includes('Cannot transfer points to yourself')) {
        errorMsg = "You can't give points to yourself! 😄";
      }
      return new Response(
        JSON.stringify({ response_type: 'ephemeral', text: `❌ ${errorMsg}` }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 7. Success! Post in-channel response
    const recipientName = `${recipientProfile.first_name} ${recipientProfile.last_name}`;
    const senderName = `${senderProfile.first_name} ${senderProfile.last_name}`;

    console.log('[SLACK-SLASH-COMMAND] Points transferred successfully:', {
      sender: senderName,
      recipient: recipientName,
      points: parsed.points,
    });

    // Also trigger Slack notification if enabled
    try {
      await supabase.functions.invoke('send-slack-notification', {
        body: {
          company_id,
          notification_type: 'recognition',
          message: parsed.message,
          sender_name: senderName,
          recipient_name: recipientName,
          points: parsed.points,
        },
      });
    } catch (notifError) {
      console.warn('[SLACK-SLASH-COMMAND] Failed to send notification (non-blocking):', notifError);
    }

    return new Response(
      JSON.stringify({
        response_type: 'in_channel',
        text: `🎉 *${senderName}* gave *${parsed.points} points* to *${recipientName}*!\n_"${parsed.message}"_`,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[SLACK-SLASH-COMMAND] Unexpected error:', error);
    return new Response(
      JSON.stringify({ response_type: 'ephemeral', text: '❌ An unexpected error occurred. Please try again.' }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }
});
