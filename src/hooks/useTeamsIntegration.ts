import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEffect } from 'react';

export interface TeamsNotificationSettings {
  recognition_notifications: boolean;
  point_allocation_alerts: boolean;
  team_milestones: boolean;
  weekly_monthly_summaries: boolean;
}

export interface TeamsIntegration {
  id: string;
  company_id: string;
  webhook_url: string | null;
  channel_name: string | null;
  auth_type: string;
  team_id: string | null;
  team_name: string | null;
  channel_id: string | null;
  notification_settings: TeamsNotificationSettings;
  created_at: string;
  updated_at: string;
}

export interface MsTeam {
  id: string;
  displayName: string;
  description?: string;
}

export interface MsChannel {
  id: string;
  displayName: string;
  description?: string;
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

  // Fetch Teams integration
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
      return {
        ...data,
        notification_settings: data.notification_settings as unknown as TeamsNotificationSettings,
      } as TeamsIntegration;
    },
    enabled: !!companyId,
  });

  // Handle OAuth callback — detect code in URL
  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');
    if (code && url.pathname.includes('/settings')) {
      // Clean the URL
      url.searchParams.delete('code');
      url.searchParams.delete('session_state');
      window.history.replaceState({}, '', url.toString());
      // Exchange code
      handleOAuthCallback(code);
    }
  }, []);

  const handleOAuthCallback = async (code: string) => {
    try {
      const redirectUri = `${window.location.origin}${window.location.pathname}`;
      const { data, error } = await supabase.functions.invoke('teams-oauth-callback', {
        body: { code, redirect_uri: redirectUri },
      });
      if (error) throw error;
      toast.success(`Connected to Microsoft Teams as ${data?.display_name || 'user'}`);
      queryClient.invalidateQueries({ queryKey: ['teams-integration', companyId] });
    } catch (err) {
      console.error('OAuth callback error:', err);
      toast.error('Failed to connect Microsoft Teams');
    }
  };

  // Connect via OAuth — redirect to Microsoft login
  const connectViaOAuth = async () => {
    try {
      const redirectUri = `${window.location.origin}${window.location.pathname}`;
      const { data, error } = await supabase.functions.invoke('teams-oauth-url', {
        body: { redirect_uri: redirectUri },
      });
      if (error) throw error;
      if (data?.auth_url) {
        window.location.href = data.auth_url;
      }
    } catch (err) {
      console.error('Failed to get OAuth URL:', err);
      toast.error('Failed to start Microsoft Teams connection');
    }
  };

  // Fetch teams from Graph API
  const { data: teamsData, isLoading: isLoadingTeams, refetch: refetchTeams } = useQuery({
    queryKey: ['ms-teams-list', companyId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-teams-channels', {});
      if (error) throw error;
      return (data?.teams || []) as MsTeam[];
    },
    enabled: !!companyId && integration?.auth_type === 'oauth',
  });

  // Fetch channels for a selected team
  const fetchChannels = async (teamId: string): Promise<MsChannel[]> => {
    const { data, error } = await supabase.functions.invoke(`get-teams-channels?team_id=${teamId}`, {});
    if (error) throw error;
    return (data?.channels || []) as MsChannel[];
  };

  // Select team and channel
  const selectTeamAndChannel = useMutation({
    mutationFn: async ({ teamId, teamName, channelId, channelName }: { teamId: string; teamName: string; channelId: string; channelName: string }) => {
      if (!integration?.id) throw new Error('No integration found');
      const { error } = await supabase
        .from('teams_integrations')
        .update({ team_id: teamId, team_name: teamName, channel_id: channelId, channel_name: channelName })
        .eq('id', integration.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams-integration', companyId] });
      toast.success('Team and channel updated');
    },
    onError: () => toast.error('Failed to update team and channel'),
  });

  // Connect via webhook (legacy)
  const connectTeams = useMutation({
    mutationFn: async ({ webhookUrl, channelName }: { webhookUrl: string; channelName?: string }) => {
      if (!companyId) throw new Error('No company ID');
      const { data, error } = await supabase
        .from('teams_integrations')
        .upsert({
          company_id: companyId,
          webhook_url: webhookUrl,
          channel_name: channelName || null,
          auth_type: 'webhook',
          notification_settings: {
            recognition_notifications: true,
            point_allocation_alerts: false,
            team_milestones: false,
            weekly_monthly_summaries: false,
          },
        }, { onConflict: 'company_id' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams-integration', companyId] });
      toast.success('Microsoft Teams connected via webhook');
    },
    onError: () => toast.error('Failed to connect Microsoft Teams'),
  });

  // Update notification settings
  const updateNotificationSettings = useMutation({
    mutationFn: async (settings: Partial<TeamsNotificationSettings>) => {
      if (!integration?.id) throw new Error('No integration found');
      const updatedSettings = { ...integration.notification_settings, ...settings };
      const { error } = await supabase
        .from('teams_integrations')
        .update({ notification_settings: updatedSettings })
        .eq('id', integration.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams-integration', companyId] });
      toast.success('Notification settings updated');
    },
    onError: () => toast.error('Failed to update notification settings'),
  });

  // Disconnect
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
    onError: () => toast.error('Failed to disconnect Microsoft Teams'),
  });

  // Test connection
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
    onSuccess: () => toast.success('Test notification sent to Teams'),
    onError: () => toast.error('Failed to send test notification'),
  });

  return {
    integration,
    isLoading,
    isConnected: !!integration,
    isOAuth: integration?.auth_type === 'oauth',
    connectViaOAuth,
    connectTeams: connectTeams.mutate,
    updateNotificationSettings: updateNotificationSettings.mutate,
    selectTeamAndChannel: selectTeamAndChannel.mutate,
    disconnectTeams: disconnectTeams.mutate,
    testConnection: testConnection.mutate,
    testConnectionAsync: testConnection.mutateAsync,
    isConnecting: connectTeams.isPending,
    isUpdating: updateNotificationSettings.isPending,
    isDisconnecting: disconnectTeams.isPending,
    isTesting: testConnection.isPending,
    isSelectingChannel: selectTeamAndChannel.isPending,
    teams: teamsData || [],
    isLoadingTeams,
    refetchTeams,
    fetchChannels,
  };
}
