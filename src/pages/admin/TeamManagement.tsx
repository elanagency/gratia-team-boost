import React, { useState } from "react";
import { useTeamMembers, type CompanyMember as TeamMember } from "@/hooks/useCompanyMembers";
import { usePaymentVerification } from "@/hooks/usePaymentVerification";
import { useTeamMemberActions } from "@/hooks/useTeamMemberActions";
import TeamManagementHeader from "@/components/team/TeamManagementHeader";
import TeamManagementContent from "@/components/team/TeamManagementContent";
import DeleteMemberDialog from "@/components/team/DeleteMemberDialog";

const TeamManagement = () => {
  const [currentPage, setCurrentPage] = useState(1);
  
  const {
    teamMembers,
    refetch: fetchTeamMembers,
    removeMember,
    isLoading,
    totalMembers,
    totalPages
  } = useTeamMembers(currentPage, 10);

  const { isVerifying } = usePaymentVerification(fetchTeamMembers);
  
  const {
    deleteDialogOpen,
    memberToDelete,
    handleDeleteClick,
    handleCancelDelete,
    handleConfirmDelete,
    setDeleteDialogOpen,
  } = useTeamMemberActions();

  const handleRemoveMember = async () => {
    if (!memberToDelete) return;
    await removeMember(memberToDelete);
    handleConfirmDelete();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };


  return (
    <div className="space-y-6">
      <TeamManagementHeader onInviteSuccess={fetchTeamMembers} />
      
      <TeamManagementContent
        teamMembers={teamMembers}
        isLoading={isLoading}
        isVerifying={isVerifying}
        currentPage={currentPage}
        totalPages={totalPages}
        totalMembers={totalMembers}
        onRemoveMember={handleDeleteClick}
        onPageChange={handlePageChange}
      />
      
      <DeleteMemberDialog 
        open={deleteDialogOpen} 
        onOpenChange={setDeleteDialogOpen} 
        member={memberToDelete} 
        onDelete={handleRemoveMember} 
        onCancel={handleCancelDelete} 
      />
    </div>
  );
};

export default TeamManagement;