import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Link2, Unlink, RefreshCw, CheckCircle, AlertCircle, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface LinkedUser {
  slack_user_id: string;
  slack_name: string;
  profile_id: string;
  profile_name: string;
}

interface UnlinkedUser {
  slack_user_id: string;
  slack_name: string;
  slack_email: string;
}

interface AutoLinkResult {
  linked: LinkedUser[];
  unlinked: UnlinkedUser[];
  already_linked: LinkedUser[];
}

interface SlackUserLinkingProps {
  companyId: string;
}

const SlackUserLinking = ({ companyId }: SlackUserLinkingProps) => {
  const [isLinking, setIsLinking] = useState(false);
  const [result, setResult] = useState<AutoLinkResult | null>(null);
  const [manualSelections, setManualSelections] = useState<Record<string, string>>({});
  const [savingManual, setSavingManual] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch company profiles for manual linking dropdown
  const { data: companyMembers } = useQuery({
    queryKey: ['companyMembersForLinking', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, slack_user_id')
        .eq('company_id', companyId)
        .eq('status', 'active')
        .order('first_name');
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  // Fetch already-linked profiles on mount
  const { data: initialLinkedProfiles } = useQuery({
    queryKey: ['linkedSlackProfiles', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, slack_user_id')
        .eq('company_id', companyId)
        .eq('status', 'active')
        .not('slack_user_id', 'is', null)
        .order('first_name');
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const handleAutoLink = async () => {
    setIsLinking(true);
    try {
      const { data, error } = await supabase.functions.invoke('slack-auto-link', {
        body: { action: 'auto_link' },
      });
      if (error) throw error;
      setResult(data as AutoLinkResult);
      queryClient.invalidateQueries({ queryKey: ['companyMembersForLinking'] });
      
      const linkedCount = (data as AutoLinkResult).linked.length;
      if (linkedCount > 0) {
        toast.success(`Auto-linked ${linkedCount} user${linkedCount > 1 ? 's' : ''}`);
      } else {
        toast.info('No new users could be auto-linked');
      }
    } catch (error) {
      console.error('Auto-link error:', error);
      toast.error('Failed to auto-link Slack users');
    } finally {
      setIsLinking(false);
    }
  };

  const handleManualLink = async (slackUserId: string, profileId: string) => {
    setSavingManual(slackUserId);
    try {
      const { error } = await supabase.functions.invoke('slack-auto-link', {
        body: { action: 'manual_link', slack_user_id: slackUserId, profile_id: profileId },
      });
      if (error) throw error;
      toast.success('User linked successfully');
      
      // Update local state
      if (result) {
        const linkedUser = result.unlinked.find(u => u.slack_user_id === slackUserId);
        const profile = companyMembers?.find(m => m.id === profileId);
        if (linkedUser && profile) {
          setResult({
            ...result,
            unlinked: result.unlinked.filter(u => u.slack_user_id !== slackUserId),
            already_linked: [
              ...result.already_linked,
              {
                slack_user_id: slackUserId,
                slack_name: linkedUser.slack_name,
                profile_id: profileId,
                profile_name: `${profile.first_name} ${profile.last_name}`,
              },
            ],
          });
        }
      }
      queryClient.invalidateQueries({ queryKey: ['companyMembersForLinking'] });
    } catch (error) {
      toast.error('Failed to link user');
    } finally {
      setSavingManual(null);
    }
  };

  const handleUnlink = async (profileId: string) => {
    try {
      const { error } = await supabase.functions.invoke('slack-auto-link', {
        body: { action: 'unlink', profile_id: profileId },
      });
      if (error) throw error;
      toast.success('User unlinked');
      
      if (result) {
        const unlinkedEntry = result.already_linked.find(u => u.profile_id === profileId);
        setResult({
          ...result,
          already_linked: result.already_linked.filter(u => u.profile_id !== profileId),
        });
      }
      queryClient.invalidateQueries({ queryKey: ['companyMembersForLinking'] });
    } catch (error) {
      toast.error('Failed to unlink user');
    }
  };

  // Get profiles not yet linked (for manual dropdown)
  const unlinkedProfiles = companyMembers?.filter(m => !m.slack_user_id) || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <h4 className="font-medium text-foreground">Slack User Linking</h4>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAutoLink}
          disabled={isLinking}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLinking ? 'animate-spin' : ''}`} />
          {isLinking ? 'Linking...' : 'Auto-Link Users'}
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Match Slack workspace members to Grattia profiles so the <code className="text-xs bg-muted px-1 py-0.5 rounded">/grattia</code> command works even when emails differ.
        You can also <strong>import new members directly from Slack</strong> using the Import Members button above.
      </p>

      {result && (
        <div className="space-y-4">
          {/* Newly linked */}
          {result.linked.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">
                  Auto-linked ({result.linked.length})
                </span>
              </div>
              <div className="space-y-1">
                {result.linked.map((u) => (
                  <div key={u.slack_user_id} className="flex items-center justify-between p-2 rounded bg-green-50 text-sm">
                    <span className="text-green-800">{u.slack_name} → {u.profile_name}</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-700 border-0 text-xs">Linked</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Already linked */}
          {result.already_linked.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Link2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">
                  Already linked ({result.already_linked.length})
                </span>
              </div>
              <div className="space-y-1">
                {result.already_linked.map((u) => (
                  <div key={u.slack_user_id} className="flex items-center justify-between p-2 rounded bg-muted/50 text-sm">
                    <span>{u.slack_name} → {u.profile_name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-muted-foreground hover:text-destructive"
                      onClick={() => handleUnlink(u.profile_id)}
                    >
                      <Unlink className="h-3 w-3 mr-1" />
                      Unlink
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unlinked - needs manual attention */}
          {result.unlinked.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-700">
                  Needs manual linking ({result.unlinked.length})
                </span>
              </div>
              <div className="space-y-2">
                {result.unlinked.map((u) => (
                  <div key={u.slack_user_id} className="flex items-center gap-3 p-2 rounded bg-amber-50/50 border border-amber-200 text-sm">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-amber-900 truncate">{u.slack_name}</p>
                      <p className="text-xs text-amber-600 truncate">{u.slack_email}</p>
                    </div>
                    <Select
                      value={manualSelections[u.slack_user_id] || ""}
                      onValueChange={(val) =>
                        setManualSelections((prev) => ({ ...prev, [u.slack_user_id]: val }))
                      }
                    >
                      <SelectTrigger className="w-[180px] h-8 text-xs">
                        <SelectValue placeholder="Select member..." />
                      </SelectTrigger>
                      <SelectContent>
                        {unlinkedProfiles.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.first_name} {p.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      disabled={!manualSelections[u.slack_user_id] || savingManual === u.slack_user_id}
                      onClick={() => handleManualLink(u.slack_user_id, manualSelections[u.slack_user_id])}
                    >
                      {savingManual === u.slack_user_id ? '...' : 'Link'}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.linked.length === 0 && result.unlinked.length === 0 && result.already_linked.length > 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">
              All Slack users are linked! ✅
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default SlackUserLinking;
