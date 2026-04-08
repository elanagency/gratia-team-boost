import React, { useState } from "react";
import { Building2, MessageSquare, Search, Upload, MoreHorizontal } from "lucide-react";
import { useCompanyMembers, type CompanyMember as TeamMember } from "@/hooks/useCompanyMembers";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import DepartmentManagement from "@/components/team/DepartmentManagement";
import TeamInviteManager from "@/components/team/TeamInviteManager";
import TeamMemberTable from "@/components/team/TeamMemberTable";
import DeleteMemberDialog from "@/components/team/DeleteMemberDialog";
import EditTeamMemberDialog from "@/components/team/EditTeamMemberDialog";
import { CSVUploadDialog } from "@/components/team/CSVUploadDialog";
import SlackImportDialog from "@/components/team/SlackImportDialog";
import { useSlackIntegration } from "@/hooks/useSlackIntegration";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const TeamManagementCard = () => {
  const { isConnected: isSlackConnected } = useSlackIntegration();
  const [slackImportOpen, setSlackImportOpen] = useState(false);
  const [deptDialogOpen, setDeptDialogOpen] = useState(false);
  const [csvDialogOpen, setCsvDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<TeamMember | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const {
    teamMembers,
    refetch: fetchTeamMembers,
    removeMember,
    isLoading,
    teamSlots,
    companyId,
    totalPages,
    totalMembers
  } = useCompanyMembers({
    includeCurrentUser: true,
    includeAdmins: true,
    page: currentPage,
    pageSize: 10,
    activeOnly: true
  });

  const filteredMembers = searchQuery
    ? teamMembers.filter(m =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.department || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : teamMembers;

  const handleRemoveMember = async () => {
    if (!memberToDelete) return;
    await removeMember(memberToDelete);
    setDeleteDialogOpen(false);
    setMemberToDelete(null);
  };

  const handleDeleteClick = (member: TeamMember) => {
    setMemberToDelete(member);
    setDeleteDialogOpen(true);
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setMemberToDelete(null);
  };

  const handleEditClick = (member: TeamMember) => {
    setMemberToEdit(member);
    setEditDialogOpen(true);
  };

  const handleEditSuccess = () => {
    fetchTeamMembers();
    setEditDialogOpen(false);
    setMemberToEdit(null);
  };

  const handleResendInvite = async (member: TeamMember) => {
    try {
      if (!companyId) throw new Error("Company ID not found");
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('name')
        .eq('id', companyId)
        .single();
      if (companyError) throw companyError;
      const hasLoggedIn = member.first_login_at !== null;
      let storedPassword = null;
      if (!hasLoggedIn) {
        const { data: memberData } = await supabase
          .from('profiles')
          .select('temporary_password')
          .eq('id', member.user_id)
          .eq('company_id', companyId)
          .single();
        storedPassword = memberData?.temporary_password;
      }
      const origin = window.location.origin;
      const { error } = await supabase.functions.invoke('send-invitation-email', {
        body: {
          email: member.email,
          name: member.name,
          companyName: company.name,
          isNewUser: !hasLoggedIn,
          password: storedPassword,
          origin
        }
      });
      if (error) throw error;
      const message = hasLoggedIn
        ? `Invitation email sent to ${member.name}`
        : `Login instructions sent to ${member.name}`;
      toast.success(message);
    } catch (error) {
      console.error("Error resending invitation:", error);
      toast.error("Failed to resend invitation email");
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <>
      <div style={{ fontFamily: "Inter, sans-serif", border: "1px solid #E8E6F0", borderRadius: 15, padding: 15 }}>
        {/* Header */}
        <div style={{ marginBottom: 16 }}>
          <div className="flex items-start justify-between mb-1">
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: "#0F0533", lineHeight: "22.5px", marginBottom: 2 }}>
                Team Members
              </h2>
              <p style={{ fontSize: 13, color: "#9996AA", lineHeight: "19.5px" }}>
                Manage who has access to your workspace · {totalMembers} members
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  style={{
                    borderRadius: 13.375,
                    borderColor: "#E8E6F0",
                    fontSize: 13,
                    fontFamily: "Inter, sans-serif",
                    height: 34,
                  }}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" style={{ fontFamily: "Inter, sans-serif", fontSize: 13 }}>
                <DropdownMenuItem onClick={() => setDeptDialogOpen(true)}>
                  <Building2 className="h-4 w-4 mr-2" />
                  Departments
                </DropdownMenuItem>
                {isSlackConnected && (
                  <DropdownMenuItem onClick={() => setSlackImportOpen(true)}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Import from Slack
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => setCsvDialogOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Search + Invite row */}
          <div className="flex items-center gap-3 mt-4">
            <div className="relative flex-1">
              <Search
                size={15}
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#9996AA",
                }}
              />
              <Input
                placeholder="Search team members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 14,
                  height: 38,
                  borderRadius: 13.375,
                  borderColor: "#E8E6F0",
                  backgroundColor: "#F5F5F7",
                  paddingLeft: 36,
                  color: "#0F0533",
                }}
                className="placeholder:text-[rgba(15,5,51,0.5)]"
              />
            </div>
            <TeamInviteManager onSuccess={fetchTeamMembers} />
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#9996AA", fontSize: 13 }}>
            Loading team members...
          </div>
        ) : (
          <TeamMemberTable
            teamMembers={filteredMembers}
            onRemoveMember={handleDeleteClick}
            onEditMember={handleEditClick}
            onResendInvite={handleResendInvite}
            currentPage={currentPage}
            totalPages={totalPages}
            totalMembers={totalMembers}
            onPageChange={handlePageChange}
          />
        )}
      </div>

      <DeleteMemberDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        member={memberToDelete}
        onDelete={handleRemoveMember}
        onCancel={handleCancelDelete}
      />

      <EditTeamMemberDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        member={memberToEdit}
        onSuccess={handleEditSuccess}
      />

      <SlackImportDialog
        open={slackImportOpen}
        onOpenChange={setSlackImportOpen}
        onSuccess={fetchTeamMembers}
      />
    </>
  );
};
