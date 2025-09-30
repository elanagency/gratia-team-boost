import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slack, Bell, Users, Calendar, TrendingUp, LogOut } from "lucide-react";
import { useSlackIntegration } from "@/hooks/useSlackIntegration";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SlackNotificationsCard = () => {
  const {
    integration,
    channels,
    isLoadingIntegration,
    isLoadingChannels,
    isConnected,
    connectSlack,
    updateChannel,
    updateNotificationSettings,
    disconnectSlack,
  } = useSlackIntegration();

  const [isConnecting, setIsConnecting] = useState(false);

  // Handle OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    
    if (code && !isConnecting) {
      setIsConnecting(true);
      const redirectUri = `${window.location.origin}${window.location.pathname}`;
      connectSlack.mutate({ code, redirect_uri: redirectUri }, {
        onSettled: () => {
          setIsConnecting(false);
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);
        },
      });
    }
  }, []);

  const handleConnectSlack = async () => {
    try {
      const redirectUri = `${window.location.origin}${window.location.pathname}`;
      const { data, error } = await supabase.functions.invoke('slack-oauth-url', {
        body: { redirect_uri: redirectUri },
      });

      if (error) throw error;

      if (data.auth_url) {
        window.location.href = data.auth_url;
      }
    } catch (error) {
      toast.error('Failed to initiate Slack connection');
      console.error('Slack connection error:', error);
    }
  };

  const notificationTypes = [
    {
      icon: Bell,
      title: "Recognition Notifications",
      description: "Get notified when team members give or receive recognition points",
      key: "recognition_notifications" as const,
    },
    {
      icon: TrendingUp,
      title: "Point Allocation Alerts",
      description: "Monthly notifications when points are allocated to team members",
      key: "point_allocation_alerts" as const,
    },
    {
      icon: Users,
      title: "Team Milestones",
      description: "Celebrate when team members reach point milestones or achievements",
      key: "team_milestones" as const,
    },
    {
      icon: Calendar,
      title: "Weekly/Monthly Summaries",
      description: "Regular summaries of team activity and engagement metrics",
      key: "weekly_monthly_summaries" as const,
    },
  ];

  if (isLoadingIntegration) {
    return (
      <Card className="dashboard-card">
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Loading Slack integration...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="dashboard-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-lg bg-[#4A154B] flex items-center justify-center">
              <Slack className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Slack Notifications</CardTitle>
              <CardDescription>Connect your Slack workspace to receive team notifications</CardDescription>
            </div>
          </div>
          {isConnected && (
            <Badge variant="secondary" className="bg-green-100 text-green-700 border-0">
              Connected
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Connection Status */}
        <div className={`flex items-center justify-between p-4 rounded-lg border-2 ${
          isConnected ? 'border-green-200 bg-green-50/50' : 'border-dashed border-gray-200 bg-gray-50/50'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
              isConnected ? 'bg-green-100' : 'bg-gray-300'
            }`}>
              <Slack className={`h-4 w-4 ${isConnected ? 'text-green-700' : 'text-gray-600'}`} />
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {isConnected ? integration?.workspace_name : 'Workspace Connection'}
              </p>
              <p className="text-sm text-gray-500">
                {isConnected ? 'Connected' : 'Not connected'}
              </p>
            </div>
          </div>
          {isConnected ? (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => disconnectSlack.mutate()}
              disabled={disconnectSlack.isPending}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Disconnect
            </Button>
          ) : (
            <Button 
              variant="outline"
              onClick={handleConnectSlack}
              disabled={isConnecting}
            >
              {isConnecting ? 'Connecting...' : 'Connect to Slack'}
            </Button>
          )}
        </div>

        {isConnected && (
          <>
            <Separator />

            {/* Channel Selection */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Default Channel</h4>
              <Select
                value={integration?.default_channel_id || ""}
                onValueChange={(channelId) => {
                  const channel = channels?.find(c => c.id === channelId);
                  if (channel) {
                    updateChannel.mutate({ 
                      channelId, 
                      channelName: channel.name 
                    });
                  }
                }}
                disabled={isLoadingChannels || !channels?.length}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a channel..." />
                </SelectTrigger>
                <SelectContent>
                  {channels?.map((channel) => (
                    <SelectItem key={channel.id} value={channel.id}>
                      # {channel.name}
                      {channel.is_private && " 🔒"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isLoadingChannels && (
                <p className="text-sm text-muted-foreground">Loading channels...</p>
              )}
            </div>

            <Separator />

            {/* Notification Types */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Notification Types</h4>
              <div className="space-y-3">
                {notificationTypes.map((notification) => (
                  <div key={notification.key} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50/50">
                    <div className="h-8 w-8 rounded-lg bg-white border flex items-center justify-center mt-0.5">
                      <notification.icon className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900">{notification.title}</h5>
                      <p className="text-sm text-gray-500 mt-1">{notification.description}</p>
                    </div>
                    <Switch
                      checked={integration?.notification_settings?.[notification.key] ?? false}
                      onCheckedChange={(checked) => {
                        updateNotificationSettings.mutate({
                          [notification.key]: checked,
                        });
                      }}
                      disabled={updateNotificationSettings.isPending}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-gray-500 text-center">
                Messages will be sent to <strong>#{integration?.default_channel_name || 'the selected channel'}</strong> based on your notification preferences.
              </p>
            </div>
          </>
        )}

        {!isConnected && (
          <div className="pt-4 border-t">
            <p className="text-sm text-gray-500 text-center">
              Connect your Slack workspace to start receiving automated notifications about team recognition and achievements.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SlackNotificationsCard;