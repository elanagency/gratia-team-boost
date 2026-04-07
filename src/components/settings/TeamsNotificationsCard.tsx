import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Loader2, Send, Unlink, Bell, Settings2 } from 'lucide-react';
import { useTeamsIntegration, type MsChannel } from '@/hooks/useTeamsIntegration';
import { TeamsTestDiagnostics, type TeamsTestDiagnosticsData } from '@/components/settings/teams/TeamsTestDiagnostics';
import { TeamsNotificationToggleRow } from '@/components/settings/TeamsNotificationToggleRow';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import teamsLogo from "@/assets/teams-logo.png";

export default function TeamsNotificationsCard() {
  const {
    integration, isLoading, isConnected, isOAuth, connectViaOAuth,
    updateNotificationSettings, selectTeamAndChannel, disconnectTeams,
    testConnectionAsync, isUpdating, isDisconnecting, isTesting,
    isSelectingChannel, teams, isLoadingTeams, fetchChannels,
  } = useTeamsIntegration();

  const [lastTest, setLastTest] = useState<TeamsTestDiagnosticsData | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [channels, setChannels] = useState<MsChannel[]>([]);
  const [isLoadingChannels, setIsLoadingChannels] = useState(false);
  const [selectedChannelId, setSelectedChannelId] = useState('');

  useEffect(() => {
    if (integration?.team_id) setSelectedTeamId(integration.team_id);
    if (integration?.channel_id) setSelectedChannelId(integration.channel_id);
  }, [integration?.team_id, integration?.channel_id]);

  useEffect(() => {
    if (!selectedTeamId || !isOAuth) return;
    const isUserChangingTeam = selectedTeamId !== integration?.team_id;
    setIsLoadingChannels(true);
    setChannels([]);
    if (isUserChangingTeam) setSelectedChannelId('');
    fetchChannels(selectedTeamId)
      .then((fetched) => {
        setChannels(fetched);
        if (!isUserChangingTeam && integration?.channel_id) {
          const saved = fetched.find((c: MsChannel) => c.id === integration.channel_id);
          if (saved) setSelectedChannelId(saved.id);
        }
      })
      .catch(() => setChannels([]))
      .finally(() => setIsLoadingChannels(false));
  }, [selectedTeamId, isOAuth]);

  const handleToggle = (key: string, value: boolean) => updateNotificationSettings({ [key]: value });

  const handleTest = async () => {
    setLastTest(null);
    try {
      const data = await testConnectionAsync();
      setLastTest({ delivered: true, ...(typeof data === 'object' && data ? (data as Record<string, unknown>) : {}) } as TeamsTestDiagnosticsData);
    } catch { setLastTest({ delivered: false }); }
  };

  const handleSaveChannel = () => {
    const team = teams.find(t => t.id === selectedTeamId);
    const channel = channels.find(c => c.id === selectedChannelId);
    if (!team || !channel) return;
    selectTeamAndChannel({ teamId: team.id, teamName: team.displayName, channelId: channel.id, channelName: channel.displayName });
  };

  const cardStyle: React.CSSProperties = {
    fontFamily: "Inter, sans-serif",
    border: "1px solid #E8E6F0",
    borderRadius: 15,
    padding: 20,
    background: "#fff",
  };

  const labelStyle: React.CSSProperties = { fontSize: 13, color: "#9996AA", fontFamily: "Inter, sans-serif" };

  if (isLoading) {
    return <div style={cardStyle} className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" style={{ color: "#9996AA" }} /></div>;
  }

  return (
    <div style={cardStyle}>
      {/* Header */}
      <h2 style={{ fontSize: 15, fontWeight: 600, color: "#0F0533", marginBottom: 2 }}>Microsoft Teams</h2>
      <p style={{ ...labelStyle, marginBottom: 20 }}>Connect your Microsoft Teams organization to send recognition notifications</p>

      {/* Connection row */}
      <div className="flex items-center justify-between" style={{ padding: "12px 16px", borderRadius: 13.375, border: "1px solid #E8E6F0", marginBottom: 20 }}>
        <div className="flex items-center gap-3">
          <img src={teamsLogo} alt="Microsoft Teams" style={{ width: 32, height: 32 }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: "#0F0533" }}>
              {isConnected
                ? (isOAuth ? `${integration?.team_name || 'Microsoft Teams'}` : integration?.channel_name || 'Teams Channel')
                : "Not Connected"}
            </p>
            <p style={{ fontSize: 12, color: "#9996AA" }}>
              {isConnected ? (isOAuth ? 'Connected via Microsoft account' : 'Connected via webhook') : 'Connect your Teams organization'}
            </p>
          </div>
        </div>
        {isConnected ? (
          <div className="flex items-center gap-2">
            <button
              onClick={handleTest}
              disabled={isTesting}
              style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 500, color: "#9996AA", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
            >
              {isTesting ? <Loader2 size={14} className="animate-spin" /> : <><Send size={14} /> Test</>}
            </button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  disabled={isDisconnecting}
                  style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 500, color: "#E53E3E", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                >
                  {isDisconnecting ? <Loader2 size={14} className="animate-spin" /> : <><Unlink size={14} /> Disconnect</>}
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Disconnect Microsoft Teams?</AlertDialogTitle>
                  <AlertDialogDescription>This will stop all notifications. You can reconnect at any time.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => disconnectTeams()}>Disconnect</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ) : (
          <button
            onClick={connectViaOAuth}
            style={{
              fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 500, height: 34, paddingLeft: 16, paddingRight: 16,
              borderRadius: 13.375, border: "none", background: "linear-gradient(135deg, #7F2BFE, #FC5BFF)", color: "#fff", cursor: "pointer",
            }}
          >
            Connect
          </button>
        )}
      </div>

      {isConnected && (
        <Accordion type="multiple" className="w-full">
          {/* Team & Channel picker */}
          {isOAuth && (
            <AccordionItem value="channel" style={{ borderColor: "#E8E6F0" }}>
              <AccordionTrigger className="hover:no-underline" style={{ fontSize: 13, fontFamily: "Inter, sans-serif" }}>
                <div className="flex items-center gap-2">
                  <Settings2 size={14} color="#9996AA" />
                  <span style={{ fontWeight: 500, color: "#0F0533" }}>Team & Channel</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 500, color: "#0F0533", display: "block", marginBottom: 4 }}>Team</label>
                      <Select value={selectedTeamId} onValueChange={setSelectedTeamId} disabled={isLoadingTeams}>
                        <SelectTrigger style={{ height: 38, borderRadius: 13.375, borderColor: "#E8E6F0", fontSize: 13 }}>
                          <SelectValue placeholder={isLoadingTeams ? 'Loading...' : 'Select a team'} />
                        </SelectTrigger>
                        <SelectContent>
                          {teams.map((team) => <SelectItem key={team.id} value={team.id}>{team.displayName}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 500, color: "#0F0533", display: "block", marginBottom: 4 }}>Channel</label>
                      <Select value={selectedChannelId} onValueChange={setSelectedChannelId} disabled={isLoadingChannels || !selectedTeamId}>
                        <SelectTrigger style={{ height: 38, borderRadius: 13.375, borderColor: "#E8E6F0", fontSize: 13 }}>
                          <SelectValue placeholder={isLoadingChannels ? 'Loading...' : 'Select a channel'} />
                        </SelectTrigger>
                        <SelectContent>
                          {channels.map((ch) => <SelectItem key={ch.id} value={ch.id}>{ch.displayName}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {selectedTeamId && selectedChannelId && (selectedTeamId !== integration?.team_id || selectedChannelId !== integration?.channel_id) && (
                    <button
                      onClick={handleSaveChannel}
                      disabled={isSelectingChannel}
                      style={{
                        fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 500, height: 32, paddingLeft: 16, paddingRight: 16,
                        borderRadius: 9.375, border: "none", background: "linear-gradient(135deg, #7F2BFE, #FC5BFF)", color: "#fff", cursor: "pointer",
                      }}
                    >
                      {isSelectingChannel ? "Saving..." : "Save Channel"}
                    </button>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Notification types */}
          <AccordionItem value="notifications" style={{ borderColor: "#E8E6F0" }}>
            <AccordionTrigger className="hover:no-underline" style={{ fontSize: 13, fontFamily: "Inter, sans-serif" }}>
              <div className="flex items-center gap-2">
                <Bell size={14} color="#9996AA" />
                <span style={{ fontWeight: 500, color: "#0F0533" }}>Notification Types</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                <TeamsNotificationToggleRow id="recognition" title="Recognition Notifications" description="When team members give each other points" checked={integration?.notification_settings?.recognition_notifications ?? true} onCheckedChange={(checked) => handleToggle('recognition_notifications', checked)} disabled={isUpdating} />
                <TeamsNotificationToggleRow id="allocation" title="Point Allocation Alerts" description="Monthly point allocations and resets" checked={false} disabled comingSoon />
                <TeamsNotificationToggleRow id="milestones" title="Team Milestones" description="Team achievements and milestones" checked={false} disabled comingSoon />
                <TeamsNotificationToggleRow id="summaries" title="Weekly/Monthly Summaries" description="Periodic recognition summaries" checked={false} disabled comingSoon />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      <TeamsTestDiagnostics data={lastTest} />
    </div>
  );
}
