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

async function resolveProfile(
  supabase: any,
  botToken: string,
  slackUserId: string,
  companyId: string,
  linkedProfiles: any[] | null
) {
  let profile = linkedProfiles?.find((p: any) => p.slack_user_id === slackUserId);
  if (profile) return profile;

  const email = await getSlackUserEmail(botToken, slackUserId);
  if (!email) return null;

  const { data: { users: allUsers } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const normalizedEmail = normalizeEmail(email);
  const authUser = allUsers.find((u: any) => u.email && normalizeEmail(u.email) === normalizedEmail);
  if (!authUser) return null;

  const { data } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, monthly_points, company_id, slack_user_id')
    .eq('id', authUser.id)
    .eq('company_id', companyId)
    .single();

  return data;
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
        label: { type: 'plain_text' as const, text: 'Who do you want to recognize?' },
        element: {
          type: 'users_select',
          action_id: 'recipient_user',
          placeholder: { type: 'plain_text' as const, text: 'Select a team member' },
        },
      },
      {
        type: 'input',
        block_id: 'points_block',
        label: { type: 'plain_text' as const, text: 'Points' },
        element: {
          type: 'plain_text_input',
          action_id: 'points_value',
          placeholder: { type: 'plain_text' as const, text: 'e.g. 50' },
        },
        hint: { type: 'plain_text' as const, text: 'Enter a positive number of points to give.' },
      },
      {
        type: 'input',
        block_id: 'message_block',
        label: { type: 'plain_text' as const, text: 'Recognition Message' },
        element: {
          type: 'plain_text_input',
          action_id: 'message_text',
          multiline: true,
          placeholder: { type: 'plain_text' as const, text: 'Amazing teamwork on the project!' },
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
    body: JSON.stringify({ trigger_id: triggerId, view: modal }),
  });

  const data = await res.json();
  if (!data.ok) {
    console.error('[SLACK-INTERACTIONS] views.open failed:', data.error, data);
    return false;
  }
  return true;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const body = await req.text();

  // Debug logging
  console.log('[SLACK-INTERACTIONS] Request received:', {
    bodyLength: body.length,
    hasTimestamp: !!req.headers.get('x-slack-request-timestamp'),
    hasSignature: !!req.headers.get('x-slack-signature'),
    signingSecretLength: SLACK_SIGNING_SECRET?.length ?? 0,
  });

  if (!SLACK_SIGNING_SECRET) {
    console.error('[SLACK-INTERACTIONS] SLACK_SIGNING_SECRET is not set!');
    return new Response('Server misconfigured', { status: 500 });
  }

  const isValid = await verifySlackSignature(req, body);
  if (!isValid) {
    console.error('[SLACK-INTERACTIONS] Invalid signature');
    return new Response('Invalid signature', { status: 401 });
  }

  // Slack sends interactions as form-encoded with a "payload" JSON field
  const params = new URLSearchParams(body);
  const payloadStr = params.get('payload');
  if (!payloadStr) {
    console.error('[SLACK-INTERACTIONS] No payload found');
    return new Response('Bad request', { status: 400 });
  }

  const payload = JSON.parse(payloadStr);
  console.log('[SLACK-INTERACTIONS] Received interaction:', payload.type, payload.callback_id || payload.view?.callback_id);

  // ==========================================
  // Handle Global Shortcut: "Give recognition"
  // ==========================================
  if (payload.type === 'shortcut' && payload.callback_id === 'give_recognition') {
    const triggerId = payload.trigger_id;
    const teamId = payload.team?.id;

    if (!triggerId || !teamId) {
      console.error('[SLACK-INTERACTIONS] Shortcut missing trigger_id or team.id');
      return new Response('', { status: 200 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: integration, error: integrationError } = await supabase
      .from('slack_integrations')
      .select('bot_token')
      .eq('workspace_id', teamId)
      .single();

    if (integrationError || !integration) {
      console.error('[SLACK-INTERACTIONS] No integration for workspace:', teamId);
      return new Response('', { status: 200 });
    }

    const opened = await openRecognitionModal(integration.bot_token, triggerId);
    if (!opened) {
      console.error('[SLACK-INTERACTIONS] Failed to open modal for shortcut');
    }

    return new Response('', { status: 200 });
  }

  // ==========================================
  // Handle Modal Submission
  // ==========================================
  if (payload.type !== 'view_submission' || payload.view?.callback_id !== 'grattia_recognition') {
    return new Response('', { status: 200 });
  }

  const values = payload.view.state.values;
  const senderSlackUserId = payload.user.id;
  const teamId = payload.user.team_id;

  const recipientSlackUserId = values.recipient_block.recipient_user.selected_user;
  const pointsText = values.points_block.points_value.value;
  const message = values.message_block.message_text.value;

  const points = parseInt(pointsText, 10);
  if (isNaN(points) || points <= 0) {
    return new Response(
      JSON.stringify({ response_action: 'errors', errors: { points_block: 'Please enter a valid positive number.' } }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!message || !message.trim()) {
    return new Response(
      JSON.stringify({ response_action: 'errors', errors: { message_block: 'Please enter a recognition message.' } }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (senderSlackUserId === recipientSlackUserId) {
    return new Response(
      JSON.stringify({ response_action: 'errors', errors: { recipient_block: "You can't give points to yourself! 😄" } }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { data: integration, error: integrationError } = await supabase
      .from('slack_integrations')
      .select('company_id, bot_token, default_channel_id')
      .eq('workspace_id', teamId)
      .single();

    if (integrationError || !integration) {
      return new Response(
        JSON.stringify({ response_action: 'errors', errors: { recipient_block: 'Grattia is not connected to this Slack workspace.' } }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { company_id, bot_token } = integration;

    const { data: slackLinkedProfiles } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, monthly_points, company_id, slack_user_id')
      .eq('company_id', company_id)
      .in('slack_user_id', [senderSlackUserId, recipientSlackUserId]);

    const [senderProfile, recipientProfile] = await Promise.all([
      resolveProfile(supabase, bot_token, senderSlackUserId, company_id, slackLinkedProfiles),
      resolveProfile(supabase, bot_token, recipientSlackUserId, company_id, slackLinkedProfiles),
    ]);

    if (!senderProfile) {
      return new Response(
        JSON.stringify({ response_action: 'errors', errors: { recipient_block: 'Your Grattia account could not be found. Ask your admin to link your Slack account.' } }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!recipientProfile) {
      return new Response(
        JSON.stringify({ response_action: 'errors', errors: { recipient_block: 'That user is not linked to a Grattia account. Ask your admin to link their account.' } }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { data: result, error: rpcError } = await supabase.rpc('transfer_points_between_users', {
      sender_user_id: senderProfile.id,
      recipient_user_id: recipientProfile.id,
      transfer_company_id: company_id,
      points_amount: points,
      transfer_description: message.trim(),
      transfer_gif_url: null,
    });

    if (rpcError) {
      console.error('[SLACK-INTERACTIONS] RPC error:', rpcError);
      return new Response(
        JSON.stringify({ response_action: 'errors', errors: { points_block: 'Something went wrong transferring points. Please try again.' } }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    const transferResult = result as { success: boolean; error?: string; current_points?: number };

    if (!transferResult.success) {
      let errorMsg = transferResult.error || 'Transfer failed.';
      let errorBlock = 'points_block';
      if (errorMsg.includes('Insufficient points')) {
        errorMsg = `You only have ${transferResult.current_points ?? 0} points available this month.`;
      } else if (errorMsg.includes('Cannot transfer points to yourself')) {
        errorMsg = "You can't give points to yourself! 😄";
        errorBlock = 'recipient_block';
      }
      return new Response(
        JSON.stringify({ response_action: 'errors', errors: { [errorBlock]: errorMsg } }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    const recipientName = `${recipientProfile.first_name} ${recipientProfile.last_name}`;
    const senderName = `${senderProfile.first_name} ${senderProfile.last_name}`;

    console.log('[SLACK-INTERACTIONS] Points transferred successfully:', { sender: senderName, recipient: recipientName, points });

    if (integration.default_channel_id) {
      try {
        await fetch('https://slack.com/api/chat.postMessage', {
          method: 'POST',
          headers: { Authorization: `Bearer ${bot_token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channel: integration.default_channel_id,
            text: `🎉 *${senderName}* gave *${points} points* to *${recipientName}*!\n_"${message.trim()}"_`,
            mrkdwn: true,
          }),
        });
      } catch (postError) {
        console.warn('[SLACK-INTERACTIONS] Failed to post confirmation (non-blocking):', postError);
      }
    }

    try {
      await supabase.functions.invoke('send-slack-notification', {
        body: {
          company_id,
          notification_type: 'recognition',
          message: message.trim(),
          sender_name: senderName,
          recipient_name: recipientName,
          points,
        },
      });
    } catch (notifError) {
      console.warn('[SLACK-INTERACTIONS] Failed to send notification (non-blocking):', notifError);
    }

    return new Response(
      JSON.stringify({ response_action: 'clear' }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[SLACK-INTERACTIONS] Unexpected error:', error);
    return new Response(
      JSON.stringify({ response_action: 'errors', errors: { points_block: 'An unexpected error occurred. Please try again.' } }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }
});
