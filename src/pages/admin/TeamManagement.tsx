
import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTeamMembers, TeamMember } from "@/hooks/useTeamMembers";
import InviteTeamMemberDialog from "@/components/team/InviteTeamMemberDialog";
import TeamMemberTable from "@/components/team/TeamMemberTable";
import DeleteMemberDialog from "@/components/team/DeleteMemberDialog";

const TeamManagement = () => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);

  const { user } = useAuth();
  const { 
    teamMembers, 
    fetchTeamMembers, 
    removeMember, 
    isLoading, 
    companyId 
  } = useTeamMembers(user?.id);

  // Add debug logging to help troubleshoot
  useEffect(() => {
    console.log("TeamManagement render:", { 
      userId: user?.id,
      companyId, 
      isLoading,
      teamMembersCount: teamMembers?.length 
    });
  }, [user?.id, companyId, isLoading, teamMembers]);

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

  // Allow invitations if user is logged in and not in initial loading state
  const allowInvite = !!user?.id && !isLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-gray-800 mb-4 sm:mb-0">Team Management</h1>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" className="text-gray-600 border-gray-300 hover:bg-gray-50">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          
          <InviteTeamMemberDialog 
            companyId={companyId} 
            userId={user?.id} 
            onSuccess={fetchTeamMembers}
            isLoading={!allowInvite}
          />
        </div>
      </div>
      
      <Card className="dashboard-card">
        {isLoading ? (
          <div className="p-8 text-center">Loading team members...</div>
        ) : (
          <TeamMemberTable 
            teamMembers={teamMembers} 
            onRemoveMember={handleDeleteClick} 
          />
        )}
      </Card>
      
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
        <h3 className="font-medium text-blue-800">Free Plan Limit</h3>
        <p className="text-blue-600 text-sm mt-1">Your current plan allows up to 3 team members. Upgrade your plan to add more team members.</p>
        <Button className="bg-[#F572FF] hover:bg-[#E061EE] mt-3">
          Upgrade Plan
        </Button>
      </div>

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
