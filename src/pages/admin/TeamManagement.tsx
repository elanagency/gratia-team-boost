
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
import { supabase } from "@/integrations/supabase/client";

const TeamManagement = () => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);
  const [searchParams] = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(false);
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
    
    if (setupStatus === 'success' && sessionId && !isVerifying) {
      console.log("Processing successful payment with session ID:", sessionId);
      setIsVerifying(true);
      
      // Verify the Stripe session and create the team member
      supabase.functions.invoke('verify-stripe-session', {
        body: { sessionId }
      }).then(({ data, error }) => {
        if (error) {
          console.error("Error verifying payment:", error);
          toast.error("Failed to process payment and create team member. Please contact support.");
        } else {
          console.log("Payment verification successful:", data);
          if (data.isNewUser && data.password) {
            toast.success(`Payment successful! Team member ${data.membership?.email || 'member'} has been created with a temporary password.`);
          } else {
            toast.success(`Payment successful! Team member has been added to your team.`);
          }
          // Refresh team members to show the newly added member
          fetchTeamMembers();
        }
      }).catch((err) => {
        console.error("Verification request failed:", err);
        toast.error("Failed to verify payment. Please contact support.");
      }).finally(() => {
        setIsVerifying(false);
        // Clean up URL params
        window.history.replaceState({}, '', '/dashboard/team');
      });
    } else if (setupStatus === 'cancelled') {
      toast.error("Billing setup was cancelled. Team member was not added.");
      
      // Clean up URL params
      window.history.replaceState({}, '', '/dashboard/team');
    }
  }, [searchParams, fetchTeamMembers, isVerifying]);

  // Add debug logging to help troubleshoot
  useEffect(() => {
    console.log("TeamManagement render:", {
      isLoading,
      teamMembersCount: teamMembers?.length,
      isVerifying
    });
  }, [isLoading, teamMembers, isVerifying]);

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
        {isLoading || isVerifying ? (
          <div className="p-8 text-center">
            {isVerifying ? "Processing payment and creating team member..." : "Loading team members..."}
          </div>
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
