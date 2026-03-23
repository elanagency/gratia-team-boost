import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Users, Calendar, TrendingUp, LogOut, Copy, CheckCircle, AlertCircle, Info, UserPlus } from "lucide-react";
import SlackImportDialog from "@/components/team/SlackImportDialog";
import slackLogo from "@/assets/slack-logo.webp";
import { useSlackIntegration } from "@/hooks/useSlackIntegration";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SlackUserLinking from "./SlackUserLinking";

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
  const [copiedCommand, setCopiedCommand] = useState(false);
  const [slackImportOpen, setSlackImportOpen] = useState(false);

  const inviteCommand = "/invite @Grattia";

  const handleCopyCommand = () => {
    navigator.clipboard.writeText(inviteCommand);
    setCopiedCommand(true);
    toast.success("Command copied to clipboard!");
    setTimeout(() => setCopiedCommand(false), 2000);
  };

  // Handle OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    
    // Skip if this is a Teams OAuth callback
    if (state === 'teams') return;
    
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
              <img src={slackLogo} alt="Slack" className="h-5 w-5 rounded" />
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
              <img src={slackLogo} alt="Slack" className="h-4 w-4 rounded" />
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

            {/* Bot Invitation Instructions */}
            {integration?.default_channel_id && (
              <>
                <div className="space-y-4 p-4 rounded-lg bg-blue-50/50 border border-blue-200">
                  <div className="flex items-start space-x-3">
                    <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Info className="h-4 w-4 text-blue-700" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div>
                        <h4 className="font-medium text-blue-900 mb-1">Add Grattia Bot to Your Channel</h4>
                        <p className="text-sm text-blue-700">
                          For notifications to work, the Grattia bot must be invited to <strong>#{integration?.default_channel_name}</strong>
                        </p>
                      </div>

                      {/* Copy Command Button */}
                      <div className="flex items-center gap-2">
                        <code className="flex-1 px-3 py-2 bg-white border border-blue-300 rounded text-sm font-mono text-gray-900">
                          {inviteCommand}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCopyCommand}
                          className="flex-shrink-0"
                        >
                          {copiedCommand ? (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4 mr-2" />
                              Copy
                            </>
                          )}
                        </Button>
                      </div>

                      {/* Step-by-step Instructions */}
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-blue-900">How to add the bot:</p>
                        <ol className="text-sm text-blue-700 space-y-1.5 ml-4 list-decimal">
                          <li>Open your Slack workspace and go to <strong>#{integration?.default_channel_name}</strong></li>
                          <li>Click the copy button above to copy the invite command</li>
                          <li>Paste the command in the channel's message box</li>
                          <li>Press Enter to invite the Grattia bot</li>
                          <li>The bot will join and you'll start receiving notifications</li>
                        </ol>
                      </div>

                      {/* Troubleshooting */}
                      <div className="pt-2 border-t border-blue-200">
                        <p className="text-xs text-blue-600 flex items-start gap-2">
                          <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <span>
                            <strong>Not working?</strong> Make sure you have permission to add apps to the channel. If you're not a channel admin, ask an admin to run the invite command.
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />
              </>
            )}

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

            <Separator />

            {/* Import from Slack */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border">
              <div>
                <h4 className="font-medium text-foreground text-sm">Import Team from Slack</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Invite workspace members directly — they'll be auto-linked for the /grattia command.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSlackImportOpen(true)}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Import Members
              </Button>
            </div>

            <SlackImportDialog
              open={slackImportOpen}
              onOpenChange={setSlackImportOpen}
            />

            <Separator />

            {/* Slack User Linking */}
            {integration?.company_id && (
              <SlackUserLinking companyId={integration.company_id} />
            )}

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