import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getValidAccessToken } from '../_shared/teams-auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TeamsNotificationPayload {
  company_id: string;
  notification_type: 'recognition' | 'point_allocation' | 'milestone' | 'summary';
  sender_name?: string;
  recipient_name?: string;
  points?: number;
  message?: string;
  title?: string;
  summary_data?: Record<string, unknown>;
  gif_url?: string;
}

interface TeamsIntegration {
  id: string;
  company_id: string;
  webhook_url: string | null;
  channel_name: string | null;
  auth_type: string;
  team_id: string | null;
  channel_id: string | null;
  notification_settings: {
    recognition_notifications: boolean;
    point_allocation_alerts: boolean;
    team_milestones: boolean;
    weekly_monthly_summaries: boolean;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const payload: TeamsNotificationPayload = await req.json();
    console.log('Received Teams notification request:', JSON.stringify(payload));

    const { company_id, notification_type } = payload;

    if (!company_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing company_id' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Fetch Teams integration
    const { data: integration, error: fetchError } = await supabase
      .from('teams_integrations')
      .select('*')
      .eq('company_id', company_id)
      .single();

    if (fetchError || !integration) {
      return new Response(
        JSON.stringify({ success: false, error: 'No Teams integration found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    const teamsIntegration = integration as TeamsIntegration;
    const settings = teamsIntegration.notification_settings;

    // Check if notification type is enabled
    const notificationTypeMap: Record<string, keyof typeof settings> = {
      'recognition': 'recognition_notifications',
      'point_allocation': 'point_allocation_alerts',
      'milestone': 'team_milestones',
      'summary': 'weekly_monthly_summaries',
    };

    const settingKey = notificationTypeMap[notification_type];
    if (settingKey && !settings[settingKey]) {
      return new Response(
        JSON.stringify({ success: false, error: 'Notification type disabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Route based on auth_type
    if (teamsIntegration.auth_type === 'oauth' && teamsIntegration.team_id && teamsIntegration.channel_id) {
      return await sendViaGraphApi(supabase, teamsIntegration, payload);
    } else if (teamsIntegration.webhook_url) {
      return await sendViaWebhook(teamsIntegration, payload);
    } else {
      return new Response(
        JSON.stringify({ success: false, error: 'No valid sending method configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in send-teams-notification:', error);
    return new Response(
      JSON.stringify({ success: false, delivered: false, error: error?.message ?? String(error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

/** Send via Microsoft Graph API (OAuth) */
async function sendViaGraphApi(
  supabase: ReturnType<typeof createClient>,
  integration: TeamsIntegration,
  payload: TeamsNotificationPayload
): Promise<Response> {
  const { access_token } = await getValidAccessToken(supabase, integration.company_id);

  const htmlContent = buildHtmlMessage(payload);

  const graphUrl = `https://graph.microsoft.com/v1.0/teams/${integration.team_id}/channels/${integration.channel_id}/messages`;
  
  const graphResponse = await fetch(graphUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      body: {
        contentType: 'html',
        content: htmlContent,
      },
    }),
  });

  const responseText = await graphResponse.text();

  if (!graphResponse.ok) {
    console.error('Graph API error:', responseText);
    return new Response(
      JSON.stringify({ success: false, delivered: false, error: 'Failed to send via Graph API', http_status: graphResponse.status }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }

  return new Response(
    JSON.stringify({ success: true, delivered: true, method: 'graph_api' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/** Send via webhook (legacy) */
async function sendViaWebhook(
  integration: TeamsIntegration,
  payload: TeamsNotificationPayload
): Promise<Response> {
  const teamsMessage = buildWebhookMessage(payload);

  const teamsResponse = await fetch(integration.webhook_url!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(teamsMessage),
  });

  const responseText = await teamsResponse.text();
  const responsePreview = responseText?.slice(0, 1500);

  if (!teamsResponse.ok) {
    return new Response(
      JSON.stringify({ success: false, delivered: false, error: 'Failed to send Teams notification', http_status: teamsResponse.status, response_body_preview: responsePreview }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }

  return new Response(
    JSON.stringify({ success: true, delivered: true, method: 'webhook', http_status: teamsResponse.status }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/** Build HTML message for Graph API */
function buildHtmlMessage(payload: TeamsNotificationPayload): string {
  const { notification_type, sender_name, recipient_name, points, message, title, gif_url } = payload;

  let html = '';
  switch (notification_type) {
    case 'recognition':
      html = `<p><strong>🎉 Recognition Alert</strong></p><p><strong>${sender_name}</strong> gave <strong>${points} points</strong> to <strong>${recipient_name}</strong></p><p>${message || 'Great work!'}</p>`;
      break;
    case 'point_allocation':
      html = `<p><strong>📊 Monthly Points Allocation</strong></p><p>${message || 'All team members have received their monthly points.'}</p>`;
      break;
    case 'milestone':
      html = `<p><strong>🏆 ${title || 'Team Milestone'}</strong></p><p>${message || 'Congratulations on reaching this milestone!'}</p>`;
      break;
    case 'summary':
      html = `<p><strong>📈 ${title || 'Weekly Recognition Summary'}</strong></p><p>${message || 'Here is your team recognition summary.'}</p>`;
      break;
    default:
      html = `<p><strong>📢 Notification</strong></p><p>${message || 'You have a new notification from Grattia.'}</p>`;
  }

  if (gif_url) {
    html += `<p><img src="${gif_url}" alt="GIF" width="300" /></p>`;
  }

  return html;
}

/** Build MessageCard for webhook */
function buildWebhookMessage(payload: TeamsNotificationPayload): Record<string, unknown> {
  const { notification_type, sender_name, recipient_name, points, message, title, summary_data, gif_url } = payload;

  switch (notification_type) {
    case 'recognition':
      return {
        '@type': 'MessageCard', '@context': 'http://schema.org/extensions', themeColor: 'F572FF',
        summary: `${sender_name} recognized ${recipient_name}`,
        sections: [{ activityTitle: '🎉 Recognition Alert', activitySubtitle: `${sender_name} gave ${points} points to ${recipient_name}`, facts: [{ name: 'Points', value: String(points) }, { name: 'Message', value: message || 'Great work!' }], markdown: true }],
      };
    case 'point_allocation':
      return {
        '@type': 'MessageCard', '@context': 'http://schema.org/extensions', themeColor: '00C2FF',
        summary: 'Monthly Points Allocated',
        sections: [{ activityTitle: '📊 Monthly Points Allocation', text: message || 'All team members have received their monthly points.', markdown: true }],
      };
    case 'milestone':
      return {
        '@type': 'MessageCard', '@context': 'http://schema.org/extensions', themeColor: '00E5A1',
        summary: title || 'Team Milestone Reached',
        sections: [{ activityTitle: `🏆 ${title || 'Team Milestone'}`, text: message || 'Congratulations!', markdown: true }],
      };
    case 'summary':
      return {
        '@type': 'MessageCard', '@context': 'http://schema.org/extensions', themeColor: '7A1BF7',
        summary: title || 'Recognition Summary',
        sections: [{ activityTitle: `📈 ${title || 'Weekly Recognition Summary'}`, text: message || 'Here is your summary.', facts: summary_data ? Object.entries(summary_data).map(([k, v]) => ({ name: k, value: String(v) })) : [], markdown: true }],
      };
    default:
      return {
        '@type': 'MessageCard', '@context': 'http://schema.org/extensions', themeColor: 'F572FF',
        summary: 'Grattia Notification',
        sections: [{ activityTitle: '📢 Notification', text: message || 'You have a new notification from Grattia.', markdown: true }],
      };
  }
}
