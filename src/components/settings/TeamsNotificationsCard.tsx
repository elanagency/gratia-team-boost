import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Send, Unlink } from 'lucide-react';
import { useTeamsIntegration, type MsChannel } from '@/hooks/useTeamsIntegration';
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

import teamsLogo from "@/assets/teams-logo.png";

export default function TeamsNotificationsCard() {
  const {
    integration,
    isLoading,
    isConnected,
    isOAuth,
    connectViaOAuth,
    updateNotificationSettings,
    selectTeamAndChannel,
    disconnectTeams,
    testConnectionAsync,
    isUpdating,
    isDisconnecting,
    isTesting,
    isSelectingChannel,
    teams,
    isLoadingTeams,
    fetchChannels,
  } = useTeamsIntegration();

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
    const isUserChangingTeam = selectedTeamId !== integration?.team_id;
    setIsLoadingChannels(true);
    setChannels([]);
    if (isUserChangingTeam) {
      setSelectedChannelId('');
    }
    fetchChannels(selectedTeamId)
      .then((fetched) => {
        setChannels(fetched);
        // Re-select saved channel if it exists in the fetched list
        if (!isUserChangingTeam && integration?.channel_id) {
          const saved = fetched.find((c: MsChannel) => c.id === integration.channel_id);
          if (saved) setSelectedChannelId(saved.id);
        }
      })
      .catch(() => setChannels([]))
      .finally(() => setIsLoadingChannels(false));
  }, [selectedTeamId, isOAuth]);


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
            <img src={teamsLogo} alt="Microsoft Teams" className="h-6 w-6" />
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
              <img src={teamsLogo} alt="Microsoft Teams" className="h-6 w-6" />
              <span className="ml-2">Connect to Microsoft Teams</span>
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Sign in with your Microsoft account to select a Team and Channel
            </p>
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
