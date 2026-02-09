import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Send, Unlink, ChevronDown, ChevronUp } from 'lucide-react';
import { useTeamsIntegration, type MsChannel } from '@/hooks/useTeamsIntegration';
import { TeamsTestDiagnostics, type TeamsTestDiagnosticsData } from '@/components/settings/teams/TeamsTestDiagnostics';
import { TeamsNotificationToggleRow } from '@/components/settings/TeamsNotificationToggleRow';
import { TeamsWebhookSetupInstructions } from '@/components/settings/teams/TeamsWebhookSetupInstructions';
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
    isOAuth,
    connectViaOAuth,
    connectTeams,
    updateNotificationSettings,
    selectTeamAndChannel,
    disconnectTeams,
    testConnectionAsync,
    isConnecting,
    isUpdating,
    isDisconnecting,
    isTesting,
    isSelectingChannel,
    teams,
    isLoadingTeams,
    fetchChannels,
  } = useTeamsIntegration();

  const [webhookUrl, setWebhookUrl] = useState('');
  const [channelName, setChannelName] = useState('');
  const [showWebhookFallback, setShowWebhookFallback] = useState(false);
  const [lastTest, setLastTest] = useState<TeamsTestDiagnosticsData | null>(null);

  // Channel picker state
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [channels, setChannels] = useState<MsChannel[]>([]);
  const [isLoadingChannels, setIsLoadingChannels] = useState(false);
  const [selectedChannelId, setSelectedChannelId] = useState<string>('');

  // Pre-populate from integration
  useEffect(() => {
    if (integration?.team_id) setSelectedTeamId(integration.team_id);
    if (integration?.channel_id) setSelectedChannelId(integration.channel_id);
  }, [integration?.team_id, integration?.channel_id]);

  // Fetch channels when team changes
  useEffect(() => {
    if (!selectedTeamId || !isOAuth) return;
    setIsLoadingChannels(true);
    setChannels([]);
    setSelectedChannelId('');
    fetchChannels(selectedTeamId)
      .then(setChannels)
      .catch(() => setChannels([]))
      .finally(() => setIsLoadingChannels(false));
  }, [selectedTeamId, isOAuth]);

  const handleWebhookConnect = () => {
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
      setLastTest({
        delivered: true,
        ...(typeof data === 'object' && data ? (data as Record<string, unknown>) : {}),
      } as TeamsTestDiagnosticsData);
    } catch {
      setLastTest({ delivered: false });
    }
  };

  const handleSaveChannel = () => {
    const team = teams.find(t => t.id === selectedTeamId);
    const channel = channels.find(c => c.id === selectedChannelId);
    if (!team || !channel) return;
    selectTeamAndChannel({
      teamId: team.id,
      teamName: team.displayName,
      channelId: channel.id,
      channelName: channel.displayName,
    });
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
            {/* Primary: OAuth Connect */}
            <Button onClick={connectViaOAuth} className="w-full" size="lg">
              <TeamsLogo />
              <span className="ml-2">Connect to Microsoft Teams</span>
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Sign in with your Microsoft account to select a Team and Channel
            </p>

            <Separator />

            {/* Secondary: Webhook fallback */}
            <button
              onClick={() => setShowWebhookFallback(!showWebhookFallback)}
              className="flex w-full items-center justify-between text-left text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>Or connect via Webhook URL (advanced)</span>
              {showWebhookFallback ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {showWebhookFallback && (
              <div className="space-y-3 rounded-lg border p-4">
                <TeamsWebhookSetupInstructions />

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
                  onClick={handleWebhookConnect}
                  disabled={!webhookUrl.trim() || isConnecting}
                  variant="outline"
                  className="w-full"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    'Connect via Webhook'
                  )}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Connected status */}
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-4">
              <div>
                <p className="font-medium">
                  {isOAuth
                    ? `${integration?.team_name || 'Microsoft Teams'} — ${integration?.channel_name || 'No channel selected'}`
                    : integration?.channel_name || 'Teams Channel'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isOAuth ? 'Connected via Microsoft account' : 'Connected via webhook'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleTest} disabled={isTesting}>
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

            {/* Team & Channel picker (OAuth only) */}
            {isOAuth && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h4 className="font-medium">Team & Channel</h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Team</Label>
                      <Select value={selectedTeamId} onValueChange={setSelectedTeamId} disabled={isLoadingTeams}>
                        <SelectTrigger>
                          <SelectValue placeholder={isLoadingTeams ? 'Loading teams...' : 'Select a team'} />
                        </SelectTrigger>
                        <SelectContent>
                          {teams.map((team) => (
                            <SelectItem key={team.id} value={team.id}>{team.displayName}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Channel</Label>
                      <Select value={selectedChannelId} onValueChange={setSelectedChannelId} disabled={isLoadingChannels || !selectedTeamId}>
                        <SelectTrigger>
                          <SelectValue placeholder={isLoadingChannels ? 'Loading channels...' : 'Select a channel'} />
                        </SelectTrigger>
                        <SelectContent>
                          {channels.map((ch) => (
                            <SelectItem key={ch.id} value={ch.id}>{ch.displayName}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {selectedTeamId && selectedChannelId && (
                    selectedTeamId !== integration?.team_id || selectedChannelId !== integration?.channel_id
                  ) && (
                    <Button onClick={handleSaveChannel} disabled={isSelectingChannel} size="sm">
                      {isSelectingChannel ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Save Channel
                    </Button>
                  )}
                </div>
              </>
            )}

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
