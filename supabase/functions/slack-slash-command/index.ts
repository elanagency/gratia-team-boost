import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SLACK_SIGNING_SECRET = Deno.env.get('SLACK_SIGNING_SECRET')!;

async function verifySlackSignature(req: Request, body: string): Promise<boolean> {
  const timestamp = req.headers.get('x-slack-request-timestamp');
  const slackSignature = req.headers.get('x-slack-signature');

  if (!timestamp || !slackSignature) return false;

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
  const trimmed = text.trim();
  if (!trimmed) return null;

  const encodedMentionMatch = trimmed.match(/^<@([A-Z0-9]+)(?:\|[^>]*)?>[\s]+(\d+)[\s]+([\s\S]+)$/);
  if (encodedMentionMatch) {
    return {
      slackUserId: encodedMentionMatch[1],
      points: parseInt(encodedMentionMatch[2], 10),
      message: encodedMentionMatch[3].trim(),
    };
  }

  const plainMentionMatch = trimmed.match(/^@(\S+)[\s]+(\d+)[\s]+([\s\S]+)$/);
  if (plainMentionMatch) {
    return {
      slackUserId: null,
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

async function openRecognitionModal(botToken: string, triggerId: string): Promise<boolean> {
  const modal = {
    type: 'modal' as const,
    callback_id: 'grattia_recognition',
    title: {
      type: 'plain_text' as const,
      text: '🎉 Give Recognition',
    },
    submit: {
      type: 'plain_text' as const,
      text: 'Send Recognition',
    },
    close: {
      type: 'plain_text' as const,
      text: 'Cancel',
    },
    blocks: [
      {
        type: 'input',
        block_id: 'recipient_block',
        label: {
          type: 'plain_text' as const,
          text: 'Who do you want to recognize?',
        },
        element: {
          type: 'users_select',
          action_id: 'recipient_user',
          placeholder: {
            type: 'plain_text' as const,
            text: 'Select a team member',
          },
        },
      },
      {
        type: 'input',
        block_id: 'points_block',
        label: {
          type: 'plain_text' as const,
          text: 'Points',
        },
        element: {
          type: 'plain_text_input',
          action_id: 'points_value',
          placeholder: {
            type: 'plain_text' as const,
            text: 'e.g. 50',
          },
        },
        hint: {
          type: 'plain_text' as const,
          text: 'Enter a positive number of points to give.',
        },
      },
      {
        type: 'input',
        block_id: 'message_block',
        label: {
          type: 'plain_text' as const,
          text: 'Recognition Message',
        },
        element: {
          type: 'plain_text_input',
          action_id: 'message_text',
          multiline: true,
          placeholder: {
            type: 'plain_text' as const,
            text: 'Amazing teamwork on the project!',
          },
        },
      },
    ],
  };

  const res = await fetch('https://slack.com/api/views.open', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${botToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      trigger_id: triggerId,
      view: modal,
    }),
  });

  const data = await res.json();
  if (!data.ok) {
    console.error('[SLACK-SLASH-COMMAND] views.open failed:', data.error);
    return false;
  }
  return true;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const body = await req.text();

  const isValid = await verifySlackSignature(req, body);
  if (!isValid) {
    console.error('[SLACK-SLASH-COMMAND] Invalid signature');
    return new Response('Invalid signature', { status: 401 });
  }

  const params = new URLSearchParams(body);
  const teamId = params.get('team_id');
  const senderSlackUserId = params.get('user_id');
  const text = params.get('text') || '';
  const triggerId = params.get('trigger_id');

  const command = params.get('command');
  console.log('[SLACK-SLASH-COMMAND] Received command:', { command, teamId, senderSlackUserId, text, hasTriggerId: !!triggerId });

  if (!teamId || !senderSlackUserId) {
    return new Response(
      JSON.stringify({ response_type: 'ephemeral', text: '❌ Invalid request from Slack.' }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  // /give_recognition always opens the Block Kit modal
  if (command === '/give_recognition' && triggerId) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: integration, error: integrationError } = await supabase
      .from('slack_integrations')
      .select('bot_token')
      .eq('workspace_id', teamId)
      .single();

    if (integrationError || !integration) {
      return new Response(
        JSON.stringify({ response_type: 'ephemeral', text: '❌ Grattia is not connected to this Slack workspace.' }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    const opened = await openRecognitionModal(integration.bot_token, triggerId);
    if (!opened) {
      return new Response(
        JSON.stringify({ response_type: 'ephemeral', text: '❌ Could not open the recognition form. Please try again.' }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Return empty 200 — the modal handles the rest
    return new Response('', { status: 200 });
  }

  // ===== FALLBACK: Text-based command parsing (existing logic) =====
  const parsed = parseCommandText(text);
  if (!parsed) {
    return new Response(
      JSON.stringify({
        response_type: 'ephemeral',
        text: '❌ Usage: `/grattia @user [points] [message]`\nOr just type `/grattia` to open the recognition form.\nExample: `/grattia @john 50 Amazing teamwork on the project!`',
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

    let recipientSlackUserId = parsed.slackUserId;
    if (!recipientSlackUserId) {
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

    const { data: slackLinkedProfiles } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, monthly_points, company_id, slack_user_id')
      .eq('company_id', company_id)
      .in('slack_user_id', [senderSlackUserId, recipientSlackUserId]);

    let senderProfile = slackLinkedProfiles?.find((p) => p.slack_user_id === senderSlackUserId);
    let recipientProfile = slackLinkedProfiles?.find((p) => p.slack_user_id === recipientSlackUserId);

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

    const recipientName = `${recipientProfile.first_name} ${recipientProfile.last_name}`;
    const senderName = `${senderProfile.first_name} ${senderProfile.last_name}`;

    console.log('[SLACK-SLASH-COMMAND] Points transferred successfully:', {
      sender: senderName,
      recipient: recipientName,
      points: parsed.points,
    });

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
