import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
}

interface TeamsIntegration {
  id: string;
  company_id: string;
  webhook_url: string;
  channel_name: string | null;
  notification_settings: {
    recognition_notifications: boolean;
    point_allocation_alerts: boolean;
    team_milestones: boolean;
    weekly_monthly_summaries: boolean;
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
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
      console.log('Missing company_id');
      return new Response(
        JSON.stringify({ success: false, error: 'Missing company_id' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Fetch Teams integration for the company
    const { data: integration, error: fetchError } = await supabase
      .from('teams_integrations')
      .select('*')
      .eq('company_id', company_id)
      .single();

    if (fetchError || !integration) {
      console.log('No Teams integration found for company:', company_id);
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
      console.log(`Notification type ${notification_type} is disabled`);
      return new Response(
        JSON.stringify({ success: false, error: 'Notification type disabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Build Microsoft Teams Adaptive Card message
    const teamsMessage = buildTeamsMessage(payload);
    console.log('Sending Teams message:', JSON.stringify(teamsMessage));

    // Send to Microsoft Teams webhook
    const teamsResponse = await fetch(teamsIntegration.webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(teamsMessage),
    });

    if (!teamsResponse.ok) {
      const errorText = await teamsResponse.text();
      console.error('Teams webhook error:', errorText);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to send Teams notification' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('Teams notification sent successfully');
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-teams-notification:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

function buildTeamsMessage(payload: TeamsNotificationPayload): Record<string, unknown> {
  const { notification_type, sender_name, recipient_name, points, message, title, summary_data } = payload;

  // Use MessageCard format (O365 Connector format) for wider compatibility
  switch (notification_type) {
    case 'recognition':
      return {
        '@type': 'MessageCard',
        '@context': 'http://schema.org/extensions',
        themeColor: 'F572FF',
        summary: `${sender_name} recognized ${recipient_name}`,
        sections: [
          {
            activityTitle: '🎉 Recognition Alert',
            activitySubtitle: `${sender_name} gave ${points} points to ${recipient_name}`,
            facts: [
              { name: 'Points', value: String(points) },
              { name: 'Message', value: message || 'Great work!' },
            ],
            markdown: true,
          },
        ],
      };

    case 'point_allocation':
      return {
        '@type': 'MessageCard',
        '@context': 'http://schema.org/extensions',
        themeColor: '00C2FF',
        summary: 'Monthly Points Allocated',
        sections: [
          {
            activityTitle: '📊 Monthly Points Allocation',
            activitySubtitle: 'Points have been allocated for this month',
            text: message || 'All team members have received their monthly points.',
            markdown: true,
          },
        ],
      };

    case 'milestone':
      return {
        '@type': 'MessageCard',
        '@context': 'http://schema.org/extensions',
        themeColor: '00E5A1',
        summary: title || 'Team Milestone Reached',
        sections: [
          {
            activityTitle: `🏆 ${title || 'Team Milestone'}`,
            text: message || 'Congratulations on reaching this milestone!',
            markdown: true,
          },
        ],
      };

    case 'summary':
      return {
        '@type': 'MessageCard',
        '@context': 'http://schema.org/extensions',
        themeColor: '7A1BF7',
        summary: title || 'Recognition Summary',
        sections: [
          {
            activityTitle: `📈 ${title || 'Weekly Recognition Summary'}`,
            text: message || 'Here is your team recognition summary.',
            facts: summary_data
              ? Object.entries(summary_data).map(([key, value]) => ({
                  name: key,
                  value: String(value),
                }))
              : [],
            markdown: true,
          },
        ],
      };

    default:
      return {
        '@type': 'MessageCard',
        '@context': 'http://schema.org/extensions',
        themeColor: 'F572FF',
        summary: 'Grattia Notification',
        sections: [
          {
            activityTitle: '📢 Notification',
            text: message || 'You have a new notification from Grattia.',
            markdown: true,
          },
        ],
      };
  }
}
