import React, { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, AlertTriangle } from "lucide-react";
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const processedSessionIds = useRef(new Set<string>());
  
  const {
    teamMembers,
    fetchTeamMembers,
    removeMember,
    isLoading,
    teamSlots,
    totalMembers,
    totalPages
  } = useTeamMembers(currentPage, 10);

  // Handle billing setup success/cancellation from URL params
  useEffect(() => {
    const setupStatus = searchParams.get('setup');
    const sessionId = searchParams.get('session_id');
    
    if (setupStatus === 'success' && sessionId) {
      if (processedSessionIds.current.has(sessionId) || isVerifying) {
        return;
      }

      console.log("Processing successful payment with session ID:", sessionId);
      setIsVerifying(true);
      
      processedSessionIds.current.add(sessionId);
      
      supabase.functions.invoke('verify-stripe-session', {
        body: { sessionId }
      }).then(({ data, error }) => {
        if (error) {
          console.error("Error verifying payment:", error);
          toast.error("Failed to process subscription setup. Please contact support.");
        } else {
          console.log("Payment verification successful:", data);
          toast.success("Subscription setup successful! You can now add team members.");
          fetchTeamMembers();
        }
      }).catch((err) => {
        console.error("Verification request failed:", err);
        toast.error("Failed to verify payment. Please contact support.");
      }).finally(() => {
        setIsVerifying(false);
        window.history.replaceState({}, '', '/dashboard/team');
      });
    } else if (setupStatus === 'cancelled') {
      toast.error("Subscription setup was cancelled.");
      window.history.replaceState({}, '', '/dashboard/team');
    }
  }, [searchParams, fetchTeamMembers, isVerifying]);

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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-gray-800 mb-4 sm:mb-0">Team Management</h1>
        
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <InviteTeamMemberDialog onSuccess={fetchTeamMembers} />
        </div>
      </div>
      
      <Card className="dashboard-card">
        {isLoading || isVerifying ? (
          <div className="p-8 text-center">
            {isVerifying ? "Processing subscription setup..." : "Loading team members..."}
          </div>
        ) : (
          <TeamMemberTable 
            teamMembers={teamMembers} 
            onRemoveMember={handleDeleteClick}
            currentPage={currentPage}
            totalPages={totalPages}
            totalMembers={totalMembers}
            onPageChange={handlePageChange}
          />
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