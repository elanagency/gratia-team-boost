import React, { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, AlertTriangle } from "lucide-react";
import { useTeamMembers, TeamMember } from "@/hooks/useTeamMembers";
import InviteTeamMemberDialog from "@/components/team/InviteTeamMemberDialog";
import TeamMemberTable from "@/components/team/TeamMemberTable";
import DeleteMemberDialog from "@/components/team/DeleteMemberDialog";
import EditTeamMemberDialog from "@/components/team/EditTeamMemberDialog";
import { CSVUploadDialog } from "@/components/team/CSVUploadDialog";
import { toast } from "@/components/ui/use-toast";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export const TeamManagementCard = () => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<TeamMember | null>(null);
  const [searchParams] = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(false);
  const processedSessionIds = useRef(new Set<string>());
  const {
    teamMembers,
    fetchTeamMembers,
    removeMember,
    isLoading,
    teamSlots,
    companyId
  } = useTeamMembers();

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
        window.history.replaceState({}, '', '/dashboard/settings');
      });
    } else if (setupStatus === 'cancelled') {
      toast.error("Subscription setup was cancelled.");
      window.history.replaceState({}, '', '/dashboard/settings');
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
      
      const origin = window.location.origin;
      
      // Call the send invitation email function
      const { error } = await supabase.functions.invoke('send-invitation-email', {
        body: {
          email: member.email,
          name: member.name,
          companyName: company.name,
          isNewUser: false, // This is a re-send, so user already exists
          origin
        }
      });
      
      if (error) throw error;
      
      toast.success(`Invitation email sent to ${member.name}`);
    } catch (error) {
      console.error("Error resending invitation:", error);
      toast.error("Failed to resend invitation email");
    }
  };

  return (
    <>
      <Card className="dashboard-card">
        <div className="card-header">
          <h2 className="card-title">Team Management</h2>
          
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <InviteTeamMemberDialog onSuccess={fetchTeamMembers} />
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