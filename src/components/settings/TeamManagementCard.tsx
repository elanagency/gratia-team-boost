
import React, { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, AlertTriangle } from "lucide-react";
import { useTeamMembers, TeamMember } from "@/hooks/useTeamMembers";
import InviteTeamMemberDialog from "@/components/team/InviteTeamMemberDialog";
import BulkUploadDialog from "@/components/team/BulkUploadDialog";
import TeamMemberTable from "@/components/team/TeamMemberTable";
import DeleteMemberDialog from "@/components/team/DeleteMemberDialog";
import { toast } from "@/components/ui/use-toast";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export const TeamManagementCard = () => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);
  const [searchParams] = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(false);
  const processedSessionIds = useRef(new Set<string>());
  const {
    teamMembers,
    fetchTeamMembers,
    removeMember,
    isLoading,
    teamSlots
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
          toast.error("Failed to process payment and setup team slots. Please contact support.");
        } else {
          console.log("Payment verification successful:", data);
          toast.success(`Payment successful! You now have ${data.teamSlots} team slots available.`);
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
      toast.error("Team slots purchase was cancelled.");
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

  const shouldShowUpgradeWarning = teamSlots.total > 0 && teamSlots.available <= 1;

  return (
    <>
      <Card className="dashboard-card">
        <div className="card-header">
          <h2 className="card-title">Team Management</h2>
          
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            {/* Available Slots Display */}
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
              <Users className="h-4 w-4 text-[#F572FF]" />
              <span className="text-sm font-medium text-gray-700">
                Available Slots: <span className="text-[#F572FF]">{teamSlots.available}</span>
              </span>
            </div>
            
            <div className="flex gap-2">
              <BulkUploadDialog 
                onSuccess={fetchTeamMembers} 
                availableSlots={teamSlots.available}
              />
              <InviteTeamMemberDialog onSuccess={fetchTeamMembers} />
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {shouldShowUpgradeWarning && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-amber-800">Running low on team slots</p>
                <p className="text-amber-700">
                  You have only {teamSlots.available} slot{teamSlots.available !== 1 ? 's' : ''} remaining. 
                  Consider upgrading in the billing section to add more team members.
                </p>
              </div>
            </div>
          )}

          {teamSlots.total === 0 && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
              <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="font-medium text-gray-800 mb-1">No Team Slots Purchased</p>
              <p className="text-sm text-gray-600 mb-3">
                Purchase team slots in the billing section to start adding members to your organization.
              </p>
            </div>
          )}
          
          {isLoading || isVerifying ? (
            <div className="p-8 text-center">
              {isVerifying ? "Processing payment and setting up team slots..." : "Loading team members..."}
            </div>
          ) : (
            <TeamMemberTable teamMembers={teamMembers} onRemoveMember={handleDeleteClick} />
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
    </>
  );
};
