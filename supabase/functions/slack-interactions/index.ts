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
  // Try slack_user_id first
  let profile = linkedProfiles?.find((p: any) => p.slack_user_id === slackUserId);
  if (profile) return profile;

  // Fallback: email-based lookup
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

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const body = await req.text();

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
  console.log('[SLACK-INTERACTIONS] Received interaction:', payload.type, payload.view?.callback_id);

  // Only handle view_submission for our modal
  if (payload.type !== 'view_submission' || payload.view?.callback_id !== 'grattia_recognition') {
    // Acknowledge unknown interactions
    return new Response('', { status: 200 });
  }

  const values = payload.view.state.values;
  const senderSlackUserId = payload.user.id;
  const teamId = payload.user.team_id;

  // Extract form values
  const recipientSlackUserId = values.recipient_block.recipient_user.selected_user;
  const pointsText = values.points_block.points_value.value;
  const message = values.message_block.message_text.value;

  // Validate points
  const points = parseInt(pointsText, 10);
  if (isNaN(points) || points <= 0) {
    return new Response(
      JSON.stringify({
        response_action: 'errors',
        errors: {
          points_block: 'Please enter a valid positive number.',
        },
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!message || !message.trim()) {
    return new Response(
      JSON.stringify({
        response_action: 'errors',
        errors: {
          message_block: 'Please enter a recognition message.',
        },
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (senderSlackUserId === recipientSlackUserId) {
    return new Response(
      JSON.stringify({
        response_action: 'errors',
        errors: {
          recipient_block: "You can't give points to yourself! 😄",
        },
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Look up integration
    const { data: integration, error: integrationError } = await supabase
      .from('slack_integrations')
      .select('company_id, bot_token, default_channel_id')
      .eq('workspace_id', teamId)
      .single();

    if (integrationError || !integration) {
      return new Response(
        JSON.stringify({
          response_action: 'errors',
          errors: {
            recipient_block: 'Grattia is not connected to this Slack workspace.',
          },
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { company_id, bot_token } = integration;

    // Resolve both profiles
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
        JSON.stringify({
          response_action: 'errors',
          errors: {
            recipient_block: 'Your Grattia account could not be found. Ask your admin to link your Slack account.',
          },
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!recipientProfile) {
      return new Response(
        JSON.stringify({
          response_action: 'errors',
          errors: {
            recipient_block: 'That user is not linked to a Grattia account. Ask your admin to link their account.',
          },
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Transfer points
    const { data: result, error: rpcError } = await supabase.rpc('transfer_points_between_users', {
      sender_user_id: senderProfile.id,
      recipient_user_id: recipientProfile.id,
      transfer_company_id: company_id,
      points_amount: points,
      transfer_description: message.trim(),
    });

    if (rpcError) {
      console.error('[SLACK-INTERACTIONS] RPC error:', rpcError);
      return new Response(
        JSON.stringify({
          response_action: 'errors',
          errors: {
            points_block: 'Something went wrong transferring points. Please try again.',
          },
        }),
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
        JSON.stringify({
          response_action: 'errors',
          errors: {
            [errorBlock]: errorMsg,
          },
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Success — post in-channel message
    const recipientName = `${recipientProfile.first_name} ${recipientProfile.last_name}`;
    const senderName = `${senderProfile.first_name} ${senderProfile.last_name}`;

    console.log('[SLACK-INTERACTIONS] Points transferred successfully:', {
      sender: senderName,
      recipient: recipientName,
      points,
    });

    // Post confirmation to default channel
    if (integration.default_channel_id) {
      try {
        await fetch('https://slack.com/api/chat.postMessage', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${bot_token}`,
            'Content-Type': 'application/json',
          },
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

    // Also trigger the standard notification flow
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

    // Close the modal
    return new Response(
      JSON.stringify({ response_action: 'clear' }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[SLACK-INTERACTIONS] Unexpected error:', error);
    return new Response(
      JSON.stringify({
        response_action: 'errors',
        errors: {
          points_block: 'An unexpected error occurred. Please try again.',
        },
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }
});
