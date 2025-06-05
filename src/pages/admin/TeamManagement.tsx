
import React, { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Filter, Users, AlertTriangle } from "lucide-react";
import { useTeamMembers, TeamMember } from "@/hooks/useTeamMembers";
import InviteTeamMemberDialog from "@/components/team/InviteTeamMemberDialog";
import TeamMemberTable from "@/components/team/TeamMemberTable";
import DeleteMemberDialog from "@/components/team/DeleteMemberDialog";
import { toast } from "@/components/ui/use-toast";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { TeamSlotsBillingButton } from "@/components/billing/TeamSlotsBillingButton";

const TeamManagement = () => {
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
        window.history.replaceState({}, '', '/dashboard/team');
      });
    } else if (setupStatus === 'cancelled') {
      toast.error("Team slots purchase was cancelled.");
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

  const getSlotUtilizationColor = () => {
    if (teamSlots.total === 0) return "text-gray-500";
    const utilization = (teamSlots.used / teamSlots.total) * 100;
    if (utilization >= 90) return "text-red-600";
    if (utilization >= 75) return "text-yellow-600";
    return "text-green-600";
  };

  const shouldShowUpgradeWarning = teamSlots.total > 0 && teamSlots.available <= 1;

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

      {/* Team Slots Status Card */}
      <Card className="dashboard-card">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[#F572FF]" />
              <h3 className="text-lg font-semibold">Team Slots Status</h3>
            </div>
            <TeamSlotsBillingButton 
              currentSlots={teamSlots.total}
              onSuccess={fetchTeamMembers}
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-800">{teamSlots.used}</p>
              <p className="text-sm text-gray-600">Used Slots</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className={`text-2xl font-bold ${getSlotUtilizationColor()}`}>{teamSlots.available}</p>
              <p className="text-sm text-gray-600">Available Slots</p>
            </div>
            <div className="text-center p-4 bg-[#F572FF]/10 rounded-lg">
              <p className="text-2xl font-bold text-[#F572FF]">{teamSlots.total}</p>
              <p className="text-sm text-gray-600">Total Slots</p>
            </div>
          </div>

          {teamSlots.total > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Slot Utilization</span>
                <span className={getSlotUtilizationColor()}>
                  {Math.round((teamSlots.used / teamSlots.total) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    teamSlots.used / teamSlots.total >= 0.9 ? 'bg-red-500' :
                    teamSlots.used / teamSlots.total >= 0.75 ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${Math.min((teamSlots.used / teamSlots.total) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}

          {shouldShowUpgradeWarning && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-amber-800">Running low on team slots</p>
                <p className="text-amber-700">
                  You have only {teamSlots.available} slot{teamSlots.available !== 1 ? 's' : ''} remaining. 
                  Consider upgrading to add more team members.
                </p>
              </div>
            </div>
          )}

          {teamSlots.total === 0 && (
            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
              <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="font-medium text-gray-800 mb-1">No Team Slots Purchased</p>
              <p className="text-sm text-gray-600 mb-3">
                Purchase team slots to start adding members to your organization.
              </p>
            </div>
          )}
        </div>
      </Card>
      
      <Card className="dashboard-card">
        {isLoading || isVerifying ? (
          <div className="p-8 text-center">
            {isVerifying ? "Processing payment and setting up team slots..." : "Loading team members..."}
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
