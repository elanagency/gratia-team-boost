import React, { useState } from "react";
import { useCompanyMembers, type CompanyMember as TeamMember } from "@/hooks/useCompanyMembers";
import { usePaymentVerification } from "@/hooks/usePaymentVerification";
import { useTeamMemberActions } from "@/hooks/useTeamMemberActions";
import TeamManagementHeader from "@/components/team/TeamManagementHeader";
import TeamManagementContent from "@/components/team/TeamManagementContent";
import DeleteMemberDialog from "@/components/team/DeleteMemberDialog";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

const TeamManagement = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeactivated, setShowDeactivated] = useState(false);
  
  const {
    companyMembers: teamMembers,
    refetch: fetchTeamMembers,
    removeMember,
    isLoading,
    totalMembers,
    totalPages
  } = useCompanyMembers({
    includeCurrentUser: false,
    includeAdmins: false,
    page: currentPage,
    pageSize: 10,
    activeOnly: !showDeactivated
  });

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
      <div className="flex items-center justify-between">
        <TeamManagementHeader onInviteSuccess={fetchTeamMembers} />
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDeactivated(!showDeactivated)}
          className="flex items-center gap-2"
        >
          {showDeactivated ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showDeactivated ? "Hide Deactivated" : "Show Deactivated"}
        </Button>
      </div>
      
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