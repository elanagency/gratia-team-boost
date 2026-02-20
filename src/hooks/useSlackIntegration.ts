import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SlackChannel {
  id: string;
  name: string;
  is_private: boolean;
}

export interface SlackIntegration {
  id: string;
  company_id: string;
  workspace_id: string;
  workspace_name: string;
  default_channel_id: string | null;
  default_channel_name: string | null;
  notification_settings: {
    recognition_notifications: boolean;
    point_allocation_alerts: boolean;
    team_milestones: boolean;
    weekly_monthly_summaries: boolean;
  };
}

export const useSlackIntegration = () => {
  const queryClient = useQueryClient();

  // Get current user's company
  const { data: profile } = useQuery({
    queryKey: ['currentProfile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .select('company_id, is_admin')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Get Slack integration
  const { data: integration, isLoading: isLoadingIntegration } = useQuery({
    queryKey: ['slackIntegration', profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return null;

      const { data, error } = await supabase
        .from('slack_integrations')
        .select('*')
        .eq('company_id', profile.company_id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      
      return {
        ...data,
        notification_settings: data.notification_settings as SlackIntegration['notification_settings'],
      } as SlackIntegration;
    },
    enabled: !!profile?.company_id,
  });

  // Get Slack channels
  const { data: channels, isLoading: isLoadingChannels } = useQuery({
    queryKey: ['slackChannels', profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id || !integration) return [];

      const { data, error } = await supabase.functions.invoke('get-slack-channels');

      if (error) throw error;
      return data.channels as SlackChannel[];
    },
    enabled: !!profile?.company_id && !!integration,
  });

  // Connect to Slack (OAuth callback)
  const connectSlack = useMutation({
    mutationFn: async ({ code, redirect_uri }: { code: string; redirect_uri: string }) => {
      const { data, error } = await supabase.functions.invoke('slack-oauth-callback', {
        body: { code, redirect_uri },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slackIntegration'] });
      queryClient.invalidateQueries({ queryKey: ['onboarding-progress'] });
      toast.success('Slack workspace connected successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to connect Slack: ${error.message}`);
    },
  });

  // Update channel selection
  const updateChannel = useMutation({
    mutationFn: async ({ channelId, channelName }: { channelId: string; channelName: string }) => {
      if (!profile?.company_id) throw new Error('No company ID');

      const { error } = await supabase
        .from('slack_integrations')
        .update({
          default_channel_id: channelId,
          default_channel_name: channelName,
        })
        .eq('company_id', profile.company_id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slackIntegration'] });
      toast.success('Default channel updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update channel: ${error.message}`);
    },
  });

  // Update notification settings
  const updateNotificationSettings = useMutation({
    mutationFn: async (settings: Partial<SlackIntegration['notification_settings']>) => {
      if (!profile?.company_id) throw new Error('No company ID');

      const { error } = await supabase
        .from('slack_integrations')
        .update({
          notification_settings: {
            ...integration?.notification_settings,
            ...settings,
          },
        })
        .eq('company_id', profile.company_id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slackIntegration'] });
      toast.success('Notification settings updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update settings: ${error.message}`);
    },
  });

  // Disconnect Slack
  const disconnectSlack = useMutation({
    mutationFn: async () => {
      if (!profile?.company_id) throw new Error('No company ID');

      const { error } = await supabase
        .from('slack_integrations')
        .delete()
        .eq('company_id', profile.company_id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slackIntegration'] });
      queryClient.invalidateQueries({ queryKey: ['onboarding-progress'] });
      toast.success('Slack disconnected');
    },
    onError: (error: Error) => {
      toast.error(`Failed to disconnect: ${error.message}`);
    },
  });

  return {
    integration,
    channels,
    isLoadingIntegration,
    isLoadingChannels,
    isConnected: !!integration,
    connectSlack,
    updateChannel,
    updateNotificationSettings,
    disconnectSlack,
  };
};