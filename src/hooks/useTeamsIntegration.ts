import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TeamsNotificationSettings {
  recognition_notifications: boolean;
  point_allocation_alerts: boolean;
  team_milestones: boolean;
  weekly_monthly_summaries: boolean;
}

export interface TeamsIntegration {
  id: string;
  company_id: string;
  webhook_url: string;
  channel_name: string | null;
  notification_settings: TeamsNotificationSettings;
  created_at: string;
  updated_at: string;
}

export function useTeamsIntegration() {
  const queryClient = useQueryClient();

  // Fetch current user's company_id
  const { data: profile } = useQuery({
    queryKey: ['user-profile-for-teams'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const companyId = profile?.company_id;

  // Fetch Teams integration for the company
  const { data: integration, isLoading } = useQuery({
    queryKey: ['teams-integration', companyId],
    queryFn: async () => {
      if (!companyId) return null;

      const { data, error } = await supabase
        .from('teams_integrations')
        .select('*')
        .eq('company_id', companyId)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) return null;
      
      // Cast notification_settings from Json to proper type
      return {
        ...data,
        notification_settings: data.notification_settings as unknown as TeamsNotificationSettings,
      } as TeamsIntegration;
    },
    enabled: !!companyId,
  });

  // Connect Teams (save webhook URL)
  const connectTeams = useMutation({
    mutationFn: async ({ webhookUrl, channelName }: { webhookUrl: string; channelName?: string }) => {
      if (!companyId) throw new Error('No company ID');

      const { data, error } = await supabase
        .from('teams_integrations')
        .upsert({
          company_id: companyId,
          webhook_url: webhookUrl,
          channel_name: channelName || null,
          notification_settings: {
            recognition_notifications: true,
            point_allocation_alerts: false,
            team_milestones: false,
            weekly_monthly_summaries: false,
          },
        }, {
          onConflict: 'company_id',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams-integration', companyId] });
      toast.success('Microsoft Teams connected successfully');
    },
    onError: (error) => {
      console.error('Failed to connect Teams:', error);
      toast.error('Failed to connect Microsoft Teams');
    },
  });

  // Update notification settings
  const updateNotificationSettings = useMutation({
    mutationFn: async (settings: Partial<TeamsNotificationSettings>) => {
      if (!integration?.id) throw new Error('No integration found');

      const updatedSettings = {
        ...integration.notification_settings,
        ...settings,
      };

      const { data, error } = await supabase
        .from('teams_integrations')
        .update({ notification_settings: updatedSettings })
        .eq('id', integration.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams-integration', companyId] });
      toast.success('Notification settings updated');
    },
    onError: (error) => {
      console.error('Failed to update settings:', error);
      toast.error('Failed to update notification settings');
    },
  });

  // Update channel name
  const updateChannelName = useMutation({
    mutationFn: async (channelName: string) => {
      if (!integration?.id) throw new Error('No integration found');

      const { data, error } = await supabase
        .from('teams_integrations')
        .update({ channel_name: channelName })
        .eq('id', integration.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams-integration', companyId] });
      toast.success('Channel name updated');
    },
    onError: (error) => {
      console.error('Failed to update channel:', error);
      toast.error('Failed to update channel name');
    },
  });

  // Disconnect Teams
  const disconnectTeams = useMutation({
    mutationFn: async () => {
      if (!integration?.id) throw new Error('No integration found');

      const { error } = await supabase
        .from('teams_integrations')
        .delete()
        .eq('id', integration.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams-integration', companyId] });
      toast.success('Microsoft Teams disconnected');
    },
    onError: (error) => {
      console.error('Failed to disconnect Teams:', error);
      toast.error('Failed to disconnect Microsoft Teams');
    },
  });

  // Test connection by sending a test message
  const testConnection = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error('No company ID');

      const { data, error } = await supabase.functions.invoke('send-teams-notification', {
        body: {
          company_id: companyId,
          notification_type: 'recognition',
          sender_name: 'Grattia',
          recipient_name: 'Test User',
          points: 10,
          message: '🎉 This is a test notification from Grattia!',
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Test notification sent to Teams');
    },
    onError: (error) => {
      console.error('Failed to send test notification:', error);
      toast.error('Failed to send test notification');
    },
  });

  return {
    integration,
    isLoading,
    isConnected: !!integration,
    connectTeams: connectTeams.mutate,
    updateNotificationSettings: updateNotificationSettings.mutate,
    updateChannelName: updateChannelName.mutate,
    disconnectTeams: disconnectTeams.mutate,
    testConnection: testConnection.mutate,
    testConnectionAsync: testConnection.mutateAsync,
    isConnecting: connectTeams.isPending,
    isUpdating: updateNotificationSettings.isPending || updateChannelName.isPending,
    isDisconnecting: disconnectTeams.isPending,
    isTesting: testConnection.isPending,
  };
}
