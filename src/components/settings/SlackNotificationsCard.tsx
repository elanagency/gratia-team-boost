import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { UserPlus, ChevronRight } from "lucide-react";
import SlackImportDialog from "@/components/team/SlackImportDialog";
import slackLogo from "@/assets/slack-logo.webp";
import { useSlackIntegration } from "@/hooks/useSlackIntegration";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SlackUserLinking from "./SlackUserLinking";

const SlackNotificationsCard = () => {
  const {
    integration, channels, isLoadingIntegration, isLoadingChannels, isConnected,
    connectSlack, updateChannel, disconnectSlack,
  } = useSlackIntegration();

  const [isConnecting, setIsConnecting] = useState(false);
  const [copiedCommand, setCopiedCommand] = useState(false);
  const [slackImportOpen, setSlackImportOpen] = useState(false);
  const [showBotInvite, setShowBotInvite] = useState(false);

  const inviteCommand = "/invite @Grattia";

  const handleCopyCommand = () => {
    navigator.clipboard.writeText(inviteCommand);
    setCopiedCommand(true);
    toast.success("Command copied to clipboard!");
    setTimeout(() => setCopiedCommand(false), 2000);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    if (state === 'teams') return;
    if (code && !isConnecting) {
      setIsConnecting(true);
      const redirectUri = `${window.location.origin}${window.location.pathname}`;
      connectSlack.mutate({ code, redirect_uri: redirectUri }, {
        onSettled: () => { setIsConnecting(false); window.history.replaceState({}, document.title, window.location.pathname); },
      });
    }
  }, []);

  const handleConnectSlack = async () => {
    try {
      const redirectUri = `${window.location.origin}${window.location.pathname}`;
      const { data, error } = await supabase.functions.invoke('slack-oauth-url', { body: { redirect_uri: redirectUri } });
      if (error) throw error;
      if (data.auth_url) window.location.href = data.auth_url;
    } catch (error) {
      toast.error('Failed to initiate Slack connection');
      console.error('Slack connection error:', error);
    }
  };


  const cardStyle: React.CSSProperties = {
    fontFamily: "Inter, sans-serif",
    border: "1px solid #E8E6F0",
    borderRadius: 15,
    padding: 20,
    background: "#fff",
  };

  const labelStyle: React.CSSProperties = { fontSize: 13, color: "#9996AA", fontFamily: "Inter, sans-serif" };

  if (isLoadingIntegration) {
    return <div style={cardStyle}><p style={labelStyle}>Loading Slack integration...</p></div>;
  }

  return (
    <div style={cardStyle}>
      {/* Header */}
      <h2 style={{ fontSize: 15, fontWeight: 600, color: "#0F0533", marginBottom: 2 }}>Slack</h2>
      <p style={{ ...labelStyle, marginBottom: 20 }}>Connect your Slack workspace to send recognition notifications</p>

      {/* Connection row */}
      <div className="flex items-center justify-between" style={{ padding: "12px 16px", borderRadius: 13.375, border: "1px solid #E8E6F0", marginBottom: 20 }}>
        <div className="flex items-center gap-3">
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: isConnected ? "#4A154B" : "#E8E6F0", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <img src={slackLogo} alt="Slack" style={{ width: 16, height: 16, borderRadius: 2 }} />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: "#0F0533" }}>
              {isConnected ? integration?.workspace_name : "Not Connected"}
            </p>
            <p style={{ fontSize: 12, color: "#9996AA" }}>
              {isConnected ? "Connected" : "Connect your Slack workspace"}
            </p>
          </div>
        </div>
        {isConnected ? (
          <button
            onClick={() => disconnectSlack.mutate()}
            disabled={disconnectSlack.isPending}
            style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 500, color: "#9996AA", background: "none", border: "none", cursor: "pointer" }}
          >
            Disconnect
          </button>
        ) : (
          <button
            onClick={handleConnectSlack}
            disabled={isConnecting}
            style={{
              fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 500, height: 34, paddingLeft: 16, paddingRight: 16,
              borderRadius: 13.375, border: "none", background: "linear-gradient(135deg, #7F2BFE, #FC5BFF)", color: "#fff", cursor: "pointer",
            }}
          >
            {isConnecting ? "Connecting..." : "Connect"}
          </button>
        )}
      </div>

      {isConnected && (
        <>
          {/* Channel */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: "#0F0533", display: "block", marginBottom: 6 }}>Channel</label>
            <Select
              value={integration?.default_channel_id || ""}
              onValueChange={(channelId) => {
                const channel = channels?.find(c => c.id === channelId);
                if (channel) updateChannel.mutate({ channelId, channelName: channel.name });
              }}
              disabled={isLoadingChannels || !channels?.length}
            >
              <SelectTrigger style={{ height: 38, borderRadius: 13.375, borderColor: "#E8E6F0", fontSize: 13, fontFamily: "Inter, sans-serif" }}>
                <SelectValue placeholder="Select a channel..." />
              </SelectTrigger>
              <SelectContent>
                {channels?.map((channel) => (
                  <SelectItem key={channel.id} value={channel.id}>
                    # {channel.name}{channel.is_private && " 🔒"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p style={{ fontSize: 12, color: "#9996AA", marginTop: 4 }}>Select the channel where Grattia will post notifications</p>
          </div>

          {/* Bot invite row */}
          {integration?.default_channel_id && (
            <div style={{ marginBottom: 20 }}>
              <button
                onClick={() => setShowBotInvite(!showBotInvite)}
                className="flex items-center justify-between w-full"
                style={{
                  padding: "12px 16px", borderRadius: 13.375, border: "1px solid #E8E6F0", background: "#fff",
                  fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 500, color: "#0F0533", cursor: "pointer",
                }}
              >
                <span>Add Grattia Bot to Your Channel</span>
                <ChevronRight size={16} color="#9996AA" style={{ transform: showBotInvite ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
              </button>
              {showBotInvite && (
                <div style={{ padding: "12px 16px", borderRadius: "0 0 13.375px 13.375px", border: "1px solid #E8E6F0", borderTop: "none", background: "#F8F5FF" }}>
                  <p style={{ fontSize: 12, color: "#6B6B80", marginBottom: 8 }}>
                    The Grattia bot must be invited to <strong>#{integration?.default_channel_name}</strong> for notifications to work.
                  </p>
                  <div className="flex items-center gap-2 mb-2">
                    <code style={{ flex: 1, padding: "6px 12px", background: "#fff", border: "1px solid #E8E6F0", borderRadius: 8, fontSize: 13, fontFamily: "monospace" }}>
                      {inviteCommand}
                    </code>
                    <button onClick={handleCopyCommand} style={{ fontSize: 12, fontFamily: "Inter, sans-serif", fontWeight: 500, color: "#7F2BFE", background: "none", border: "none", cursor: "pointer" }}>
                      {copiedCommand ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <ol style={{ fontSize: 12, color: "#6B6B80", paddingLeft: 16, margin: 0 }}>
                    <li>Open <strong>#{integration?.default_channel_name}</strong> in Slack</li>
                    <li>Paste the command above and press Enter</li>
                    <li>The bot will join and notifications will start</li>
                  </ol>
                </div>
              )}
            </div>
          )}

          {/* Expandable sections */}
          <Accordion type="multiple" className="w-full">
            <AccordionItem value="import" style={{ borderColor: "#E8E6F0" }}>
              <AccordionTrigger className="hover:no-underline" style={{ fontSize: 13, fontFamily: "Inter, sans-serif" }}>
                <div className="flex items-center gap-2">
                  <UserPlus size={14} color="#9996AA" />
                  <span style={{ fontWeight: 500, color: "#0F0533" }}>Import Team</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between" style={{ padding: "12px 16px", borderRadius: 10, background: "#F5F5F7", border: "1px solid #E8E6F0" }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500, color: "#0F0533" }}>Import Team from Slack</p>
                      <p style={{ fontSize: 11, color: "#9996AA" }}>Invite workspace members directly</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setSlackImportOpen(true)} style={{ borderRadius: 9.375, borderColor: "#E8E6F0", fontSize: 12 }}>
                      <UserPlus size={14} className="mr-1.5" />
                      Import
                    </Button>
                  </div>
                  {integration?.company_id && (
                    <div style={{ borderTop: "1px solid #E8E6F0", paddingTop: 16 }}>
                      <SlackUserLinking companyId={integration.company_id} />
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </>
      )}

      {!isConnected && (
        <p style={{ fontSize: 13, color: "#9996AA", textAlign: "center", paddingTop: 8 }}>
          Connect your Slack workspace to start receiving automated notifications.
        </p>
      )}

      <SlackImportDialog open={slackImportOpen} onOpenChange={setSlackImportOpen} />
    </div>
  );
};

export default SlackNotificationsCard;
