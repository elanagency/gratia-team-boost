import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface NotificationPayload {
  company_id: string;
  notification_type: 'recognition' | 'point_allocation' | 'milestone' | 'summary';
  message: string;
  sender_name?: string;
  recipient_name?: string;
  points?: number;
  gif_url?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const payload: NotificationPayload = await req.json();

    console.log('[SEND-SLACK-NOTIFICATION] Processing notification:', payload.notification_type);

    // Get the Slack integration for the company
    const { data: integration, error: integrationError } = await supabase
      .from('slack_integrations')
      .select('bot_token, default_channel_id, notification_settings')
      .eq('company_id', payload.company_id)
      .single();

    if (integrationError || !integration) {
      console.log('[SEND-SLACK-NOTIFICATION] No Slack integration found for company');
      return new Response(
        JSON.stringify({ error: 'Slack not connected' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!integration.default_channel_id) {
      console.log('[SEND-SLACK-NOTIFICATION] No default channel configured');
      return new Response(
        JSON.stringify({ error: 'No default channel configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if this notification type is enabled
    const notificationSettings = integration.notification_settings || {};
    const settingKey = payload.notification_type === 'recognition' ? 'recognition_notifications' :
                      payload.notification_type === 'point_allocation' ? 'point_allocation_alerts' :
                      payload.notification_type === 'milestone' ? 'team_milestones' :
                      'weekly_monthly_summaries';

    if (!notificationSettings[settingKey]) {
      console.log('[SEND-SLACK-NOTIFICATION] Notification type disabled:', payload.notification_type);
      return new Response(
        JSON.stringify({ message: 'Notification type disabled' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format the message based on notification type
    let formattedMessage = '';
    
    if (payload.notification_type === 'recognition') {
      formattedMessage = `🎉 *Recognition Alert*\n${payload.sender_name} gave ${payload.points} points to ${payload.recipient_name}\n_"${payload.message}"_`;
    } else if (payload.notification_type === 'point_allocation') {
      formattedMessage = `💰 *Monthly Points Allocated*\n${payload.message}`;
    } else if (payload.notification_type === 'milestone') {
      formattedMessage = `🏆 *Team Milestone*\n${payload.message}`;
    } else {
      formattedMessage = `📊 *Team Summary*\n${payload.message}`;
    }

    console.log('[SEND-SLACK-NOTIFICATION] Sending message to Slack');

    // Send message to Slack
    const slackResponse = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${integration.bot_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel: integration.default_channel_id,
        text: formattedMessage,
        mrkdwn: true,
      }),
    });

    const slackData = await slackResponse.json();

    if (!slackData.ok) {
      console.error('[SEND-SLACK-NOTIFICATION] Failed to send message:', slackData);
      return new Response(
        JSON.stringify({ error: slackData.error || 'Failed to send message' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[SEND-SLACK-NOTIFICATION] Message sent successfully');

    return new Response(
      JSON.stringify({ success: true, message_ts: slackData.ts }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[SEND-SLACK-NOTIFICATION] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});