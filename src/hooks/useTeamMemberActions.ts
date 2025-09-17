import { useState } from "react";
import { type CompanyMember as TeamMember } from "@/hooks/useCompanyMembers";

export const useTeamMemberActions = () => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);

  const handleDeleteClick = (member: TeamMember) => {
    setMemberToDelete(member);
    setDeleteDialogOpen(true);
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setMemberToDelete(null);
  };

  const handleConfirmDelete = () => {
    setDeleteDialogOpen(false);
    setMemberToDelete(null);
  };

  return {
    deleteDialogOpen,
    memberToDelete,
    handleDeleteClick,
    handleCancelDelete,
    handleConfirmDelete,
    setDeleteDialogOpen,
  };
};