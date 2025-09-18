import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, AlertTriangle } from "lucide-react";
import { useTeamMembers, type CompanyMember as TeamMember } from "@/hooks/useCompanyMembers";
import TeamInviteManager from "@/components/team/TeamInviteManager";
import TeamMemberTable from "@/components/team/TeamMemberTable";
import DeleteMemberDialog from "@/components/team/DeleteMemberDialog";
import EditTeamMemberDialog from "@/components/team/EditTeamMemberDialog";
import { CSVUploadDialog } from "@/components/team/CSVUploadDialog";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { usePaymentVerification } from "@/hooks/usePaymentVerification";

export const TeamManagementCard = () => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<TeamMember | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const {
    teamMembers,
    refetch: fetchTeamMembers,
    removeMember,
    isLoading,
    teamSlots,
    companyId,
    totalPages,
    totalMembers
  } = useTeamMembers(currentPage, 10);
  
  const { isVerifying } = usePaymentVerification(fetchTeamMembers);


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
      
      // Get company info for company name
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('name')
        .eq('id', companyId)
        .single();
        
      if (companyError) throw companyError;
      
      // Check if user has ever logged in to determine if they need credentials
      const hasLoggedIn = member.first_login_at !== null;
      
      // Fetch stored temporary password if user hasn't logged in
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
      
      // Call the send invitation email function (which now uses the centralized email service)
      const { error } = await supabase.functions.invoke('send-invitation-email', {
        body: {
          email: member.email,
          name: member.name,
          companyName: company.name,
          isNewUser: !hasLoggedIn, // Treat as new user if they haven't logged in yet
          password: storedPassword, // Include stored password for users who haven't logged in
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
      <Card className="dashboard-card">
        <div className="card-header">
          <h2 className="card-title">Team Management</h2>
          
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <TeamInviteManager onSuccess={fetchTeamMembers} />
            <CSVUploadDialog onUploadComplete={fetchTeamMembers} />
          </div>
        </div>

        <div className="p-6 space-y-4">
          {isLoading || isVerifying ? (
            <div className="p-8 text-center">
              {isVerifying ? "Processing subscription setup..." : "Loading team members..."}
            </div>
          ) : (
            <TeamMemberTable 
              teamMembers={teamMembers} 
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
      </Card>
      
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
    </>
  );
};