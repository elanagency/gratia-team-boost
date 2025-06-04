
import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import { useTeamMembers, TeamMember } from "@/hooks/useTeamMembers";
import InviteTeamMemberDialog from "@/components/team/InviteTeamMemberDialog";
import TeamMemberTable from "@/components/team/TeamMemberTable";
import DeleteMemberDialog from "@/components/team/DeleteMemberDialog";
import { toast } from "@/components/ui/use-toast";
import { useSearchParams } from "react-router-dom";

const TeamManagement = () => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);
  const [searchParams] = useSearchParams();
  const {
    teamMembers,
    fetchTeamMembers,
    removeMember,
    isLoading
  } = useTeamMembers();

  // Handle billing setup success/cancellation from URL params
  useEffect(() => {
    const setupStatus = searchParams.get('setup');
    const sessionId = searchParams.get('session_id');
    
    if (setupStatus === 'success' && sessionId) {
      toast.success("Billing setup completed successfully! Your team member has been added.");
      // Refresh team members to show the newly added member
      fetchTeamMembers();
      
      // Clean up URL params
      window.history.replaceState({}, '', '/dashboard/team');
    } else if (setupStatus === 'cancelled') {
      toast.error("Billing setup was cancelled. Team member was not added.");
      
      // Clean up URL params
      window.history.replaceState({}, '', '/dashboard/team');
    }
  }, [searchParams, fetchTeamMembers]);

  // Add debug logging to help troubleshoot
  useEffect(() => {
    console.log("TeamManagement render:", {
      isLoading,
      teamMembersCount: teamMembers?.length
    });
  }, [isLoading, teamMembers]);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-gray-800 mb-4 sm:mb-0">Team Management</h1>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" className="text-gray-600 border-gray-300 hover:bg-gray-50">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          
          <InviteTeamMemberDialog onSuccess={fetchTeamMembers} />
        </div>
      </div>
      
      <Card className="dashboard-card">
        {isLoading ? (
          <div className="p-8 text-center">Loading team members...</div>
        ) : (
          <TeamMemberTable teamMembers={teamMembers} onRemoveMember={handleDeleteClick} />
        )}
      </Card>
      
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
