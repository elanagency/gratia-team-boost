import React, { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Users, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import NewDepartmentCombobox from "./NewDepartmentCombobox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";

interface SlackMember {
  slack_user_id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  status: "available" | "already_member" | "already_linked";
  profile_name: string | null;
}

interface SelectedMember {
  slack_user_id: string;
  department: string;
}

interface SlackImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const SlackImportDialog: React.FC<SlackImportDialogProps> = ({ open, onOpenChange, onSuccess }) => {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selections, setSelections] = useState<Map<string, SelectedMember>>(new Map());
  const [bulkDepartment, setBulkDepartment] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ successCount: number; failureCount: number } | null>(null);

  const { data: slackMembers, isLoading, error, refetch } = useQuery({
    queryKey: ["slack-workspace-members", companyId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("slack-list-workspace-members");
      if (error) throw error;
      return (data.members || []) as SlackMember[];
    },
    enabled: open && !!companyId,
    staleTime: 30000,
  });

  const availableMembers = useMemo(() => {
    return (slackMembers || []).filter(m => m.status === "available");
  }, [slackMembers]);

  const existingMembers = useMemo(() => {
    return (slackMembers || []).filter(m => m.status !== "available");
  }, [slackMembers]);

  const filteredAvailable = useMemo(() => {
    if (!search.trim()) return availableMembers;
    const q = search.toLowerCase();
    return availableMembers.filter(
      m => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
    );
  }, [availableMembers, search]);

  const filteredExisting = useMemo(() => {
    if (!search.trim()) return existingMembers;
    const q = search.toLowerCase();
    return existingMembers.filter(
      m => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
    );
  }, [existingMembers, search]);

  const toggleSelect = (member: SlackMember) => {
    setSelections(prev => {
      const next = new Map(prev);
      if (next.has(member.slack_user_id)) {
        next.delete(member.slack_user_id);
      } else {
        next.set(member.slack_user_id, {
          slack_user_id: member.slack_user_id,
          department: bulkDepartment,
        });
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selections.size === filteredAvailable.length) {
      setSelections(new Map());
    } else {
      const next = new Map<string, SelectedMember>();
      filteredAvailable.forEach(m => {
        next.set(m.slack_user_id, {
          slack_user_id: m.slack_user_id,
          department: selections.get(m.slack_user_id)?.department || bulkDepartment,
        });
      });
      setSelections(next);
    }
  };

  const setMemberDepartment = (slackUserId: string, department: string) => {
    setSelections(prev => {
      const next = new Map(prev);
      const existing = next.get(slackUserId);
      if (existing) {
        next.set(slackUserId, { ...existing, department });
      }
      return next;
    });
  };

  const applyBulkDepartment = () => {
    if (!bulkDepartment.trim()) return;
    setSelections(prev => {
      const next = new Map(prev);
      next.forEach((val, key) => {
        next.set(key, { ...val, department: bulkDepartment });
      });
      return next;
    });
  };

  const handleImport = async () => {
    if (selections.size === 0) return;
    setIsImporting(true);
    setImportResult(null);

    try {
      const membersToImport = Array.from(selections.entries()).map(([slackUserId, sel]) => {
        const member = availableMembers.find(m => m.slack_user_id === slackUserId);
        return {
          slack_user_id: slackUserId,
          email: member?.email || "",
          name: member?.name || "",
          department: sel.department || null,
          role: "member",
        };
      });

      const { data, error } = await supabase.functions.invoke("bulk-invite-from-slack", {
        body: {
          members: membersToImport,
          origin: window.location.origin,
        },
      });

      if (error) throw error;

      setImportResult({
        successCount: data.successCount,
        failureCount: data.failureCount,
      });

      if (data.successCount > 0) {
        toast.success(`Successfully imported ${data.successCount} member${data.successCount > 1 ? "s" : ""} from Slack`);
        queryClient.invalidateQueries({ queryKey: ["company-members"] });
        queryClient.invalidateQueries({ queryKey: ["teamMembers"] });
        queryClient.invalidateQueries({ queryKey: ["onboarding-progress"] });
        onSuccess?.();
      }

      if (data.failureCount > 0) {
        toast.error(`${data.failureCount} member${data.failureCount > 1 ? "s" : ""} failed to import`);
      }

      // Refresh the list
      refetch();
      setSelections(new Map());
    } catch (err) {
      console.error("Slack import error:", err);
      toast.error("Failed to import members from Slack");
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setSearch("");
    setSelections(new Map());
    setImportResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Import Members from Slack
          </DialogTitle>
          <DialogDescription>
            Select Slack workspace members to invite to your team. They'll be automatically linked for the /grattia command.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading Slack members...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12 text-sm text-destructive">
            <AlertCircle className="h-5 w-5 mr-2" />
            Failed to load Slack members. Make sure Slack is connected.
          </div>
        ) : (
          <>
            {/* Search & Bulk Department */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              {selections.size > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">Set department for all selected:</span>
                  <div className="flex-1 max-w-[200px]">
                    <NewDepartmentCombobox
                      value={bulkDepartment}
                      onChange={setBulkDepartment}
                    />
                  </div>
                  <Button variant="outline" size="sm" onClick={applyBulkDepartment} disabled={!bulkDepartment.trim()}>
                    Apply
                  </Button>
                </div>
              )}
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto max-h-[400px] -mx-6 px-6">
              {/* Available members */}
              {filteredAvailable.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm font-medium text-foreground">
                      Available ({filteredAvailable.length})
                    </span>
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={toggleSelectAll}>
                      {selections.size === filteredAvailable.length ? "Deselect All" : "Select All"}
                    </Button>
                  </div>

                  {filteredAvailable.map(member => {
                    const isSelected = selections.has(member.slack_user_id);
                    const sel = selections.get(member.slack_user_id);
                    return (
                      <div
                        key={member.slack_user_id}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                          isSelected ? "border-primary/30 bg-primary/5" : "border-transparent hover:bg-muted/50"
                        }`}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelect(member)}
                        />
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {member.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{member.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                        </div>
                        {isSelected && (
                          <div className="w-[160px] flex-shrink-0">
                            <NewDepartmentCombobox
                              value={sel?.department || ""}
                              onChange={val => setMemberDepartment(member.slack_user_id, val)}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {filteredAvailable.length === 0 && !search && (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  All Slack workspace members are already in your team!
                </div>
              )}

              {filteredAvailable.length === 0 && search && (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No matching available members found.
                </div>
              )}

              {/* Existing members */}
              {filteredExisting.length > 0 && (
                <div className="space-y-1 mt-4">
                  <span className="text-sm font-medium text-muted-foreground py-2 block">
                    Already in Grattia ({filteredExisting.length})
                  </span>
                  {filteredExisting.map(member => (
                    <div
                      key={member.slack_user_id}
                      className="flex items-center gap-3 p-3 rounded-lg opacity-50"
                    >
                      <Checkbox checked disabled className="opacity-50" />
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {member.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{member.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {member.status === "already_linked" ? "Linked" : "Member"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Import result */}
            {importResult && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>
                  Imported {importResult.successCount} member{importResult.successCount !== 1 ? "s" : ""}
                  {importResult.failureCount > 0 && `, ${importResult.failureCount} failed`}
                </span>
              </div>
            )}
          </>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            {importResult ? "Done" : "Cancel"}
          </Button>
          {!importResult && (
            <Button
              onClick={handleImport}
              disabled={selections.size === 0 || isImporting}
              className="bg-[#F572FF] hover:bg-[#E061EE] text-white"
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                `Import Selected (${selections.size})`
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SlackImportDialog;
