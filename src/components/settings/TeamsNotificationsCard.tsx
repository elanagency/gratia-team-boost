import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, ExternalLink, Send, Unlink } from 'lucide-react';
import { useTeamsIntegration } from '@/hooks/useTeamsIntegration';
import { TeamsTestDiagnostics, type TeamsTestDiagnosticsData } from '@/components/settings/teams/TeamsTestDiagnostics';
import { TeamsNotificationToggleRow } from '@/components/settings/TeamsNotificationToggleRow';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

// Microsoft Teams logo SVG
const TeamsLogo = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.625 6.75H17.25V4.5C17.25 3.67157 16.5784 3 15.75 3H8.25C7.42157 3 6.75 3.67157 6.75 4.5V6.75H3.375C2.75368 6.75 2.25 7.25368 2.25 7.875V18.375C2.25 18.9963 2.75368 19.5 3.375 19.5H20.625C21.2463 19.5 21.75 18.9963 21.75 18.375V7.875C21.75 7.25368 21.2463 6.75 20.625 6.75Z" fill="#5059C9"/>
    <path d="M15.75 6.75V4.5H8.25V6.75H6.75V4.5C6.75 3.67157 7.42157 3 8.25 3H15.75C16.5784 3 17.25 3.67157 17.25 4.5V6.75H15.75Z" fill="#7B83EB"/>
    <circle cx="12" cy="12" r="3" fill="white"/>
    <path d="M19.5 9C20.3284 9 21 9.67157 21 10.5V15C21 15.8284 20.3284 16.5 19.5 16.5C18.6716 16.5 18 15.8284 18 15V10.5C18 9.67157 18.6716 9 19.5 9Z" fill="#7B83EB"/>
    <circle cx="19.5" cy="6.75" r="1.5" fill="#7B83EB"/>
  </svg>
);

export default function TeamsNotificationsCard() {
  const {
    integration,
    isLoading,
    isConnected,
    connectTeams,
    updateNotificationSettings,
    disconnectTeams,
    testConnectionAsync,
    isConnecting,
    isUpdating,
    isDisconnecting,
    isTesting,
  } = useTeamsIntegration();

  const [webhookUrl, setWebhookUrl] = useState('');
  const [channelName, setChannelName] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);
  const [lastTest, setLastTest] = useState<TeamsTestDiagnosticsData | null>(null);

  const handleConnect = () => {
    if (!webhookUrl.trim()) return;
    connectTeams({ webhookUrl: webhookUrl.trim(), channelName: channelName.trim() || undefined });
    setWebhookUrl('');
    setChannelName('');
  };

  const handleToggle = (key: string, value: boolean) => {
    updateNotificationSettings({ [key]: value });
  };

  const handleTest = async () => {
    setLastTest(null);
    try {
      const data = await testConnectionAsync();
      // Expecting the edge function to return details; fall back gracefully.
      setLastTest({
        delivered: true,
        ...(typeof data === 'object' && data ? (data as Record<string, unknown>) : {}),
      } as TeamsTestDiagnosticsData);
    } catch {
      setLastTest({ delivered: false });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TeamsLogo />
            <div>
              <CardTitle className="text-lg">Microsoft Teams Notifications</CardTitle>
              <CardDescription>
                Receive recognition alerts and updates in your Teams channel
              </CardDescription>
            </div>
          </div>
          <Badge variant={isConnected ? 'default' : 'secondary'}>
            {isConnected ? 'Connected' : 'Not Connected'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {!isConnected ? (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/50 p-4">
              <button
                onClick={() => setShowInstructions(!showInstructions)}
                className="flex w-full items-center justify-between text-left"
              >
                <span className="font-medium">How to get your Teams webhook URL</span>
                <span className="text-muted-foreground">
                  {showInstructions ? '▲' : '▼'}
                </span>
              </button>
              
              {showInstructions && (
                <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <li>1. Open Microsoft Teams and go to the channel where you want notifications</li>
                  <li>2. Click the "•••" menu next to the channel name</li>
                  <li>3. Select "Connectors" (or "Workflows" in newer Teams)</li>
                  <li>4. Search for "Incoming Webhook" and click "Configure"</li>
                  <li>5. Give it a name (e.g., "Grattia") and optionally add an image</li>
                  <li>6. Click "Create" and copy the webhook URL</li>
                  <li>7. Paste the URL below</li>
                </ol>
              )}
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="webhook-url">Webhook URL</Label>
                <Input
                  id="webhook-url"
                  type="url"
                  placeholder="https://outlook.office.com/webhook/..."
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="channel-name">Channel Name (optional)</Label>
                <Input
                  id="channel-name"
                  type="text"
                  placeholder="e.g., #general"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                />
              </div>

              <Button
                onClick={handleConnect}
                disabled={!webhookUrl.trim() || isConnecting}
                className="w-full"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Connect Microsoft Teams'
                )}
              </Button>
            </div>

            <a
              href="https://learn.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              Microsoft's official webhook documentation
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Connected status */}
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-4">
              <div>
                <p className="font-medium">
                  {integration?.channel_name || 'Teams Channel'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Webhook connected
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTest}
                  disabled={isTesting}
                >
                  {isTesting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="mr-1 h-4 w-4" />
                      Test
                    </>
                  )}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={isDisconnecting}>
                      {isDisconnecting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Unlink className="mr-1 h-4 w-4" />
                          Disconnect
                        </>
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Disconnect Microsoft Teams?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will stop all notifications from being sent to your Teams channel.
                        You can reconnect at any time.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => disconnectTeams()}>
                        Disconnect
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            <Separator />

            <TeamsTestDiagnostics data={lastTest} />

            {/* Notification settings */}
            <div className="space-y-4">
              <h4 className="font-medium">Notification Types</h4>

              <div className="space-y-3">
                <TeamsNotificationToggleRow
                  id="recognition"
                  title="Recognition Notifications"
                  description="When team members give each other points"
                  checked={integration?.notification_settings?.recognition_notifications ?? true}
                  onCheckedChange={(checked) => handleToggle('recognition_notifications', checked)}
                  disabled={isUpdating}
                />

                <TeamsNotificationToggleRow
                  id="allocation"
                  title="Point Allocation Alerts"
                  description="Monthly point allocations and resets (not available yet)"
                  checked={false}
                  disabled
                  comingSoon
                />

                <TeamsNotificationToggleRow
                  id="milestones"
                  title="Team Milestones"
                  description="Team achievements and milestones (not available yet)"
                  checked={false}
                  disabled
                  comingSoon
                />

                <TeamsNotificationToggleRow
                  id="summaries"
                  title="Weekly/Monthly Summaries"
                  description="Periodic recognition summaries (not available yet)"
                  checked={false}
                  disabled
                  comingSoon
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
