import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useTeamMembers } from "@/hooks/useCompanyMembers";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import BillingSetupDialog from "./BillingSetupDialog";
import InviteTeamMemberDialog from "./InviteTeamMemberDialog";

interface TeamInviteManagerProps {
  onSuccess: () => void;
}

const TeamInviteManager = ({ onSuccess }: TeamInviteManagerProps) => {
  const { companyId } = useAuth();
  const { teamSlots } = useTeamMembers();
  const [billingDialogOpen, setBillingDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Check if subscription exists — if not, admin needs to start one
  const needsBillingSetup = !teamSlots.has_subscription;

  const handleInviteClick = () => {
    if (needsBillingSetup) {
      setBillingDialogOpen(true);
    } else {
      setInviteDialogOpen(true);
    }
  };

  const handleBillingSetupComplete = () => {
    setBillingDialogOpen(false);
    
    // Invalidate company-related queries to refresh billing status immediately
    queryClient.invalidateQueries({ queryKey: ['company-members'] });
    queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
    queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    queryClient.invalidateQueries({ queryKey: ['onboarding-progress'] });
    
    onSuccess();
  };

  const handleInviteSuccess = () => {
    setInviteDialogOpen(false);
    onSuccess();
  };

  return (
    <>
      <Button 
        variant="default" 
        onClick={handleInviteClick}
        style={{
          background: "linear-gradient(135deg, #7F2BFE, #FC5BFF)",
          color: "#fff",
          borderRadius: 13.375,
          padding: "8.5px 13.836px 6px 15px",
          fontFamily: "Inter, sans-serif",
          fontSize: 13,
          fontWeight: 500,
          border: "none",
        }}
        className="hover:opacity-90"
      >
        <Plus className="mr-1.5 h-3.5 w-3.5" />
        Invite
      </Button>

      <BillingSetupDialog
        open={billingDialogOpen}
        onOpenChange={setBillingDialogOpen}
        onSetupComplete={handleBillingSetupComplete}
      />

      <InviteTeamMemberDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        onSuccess={handleInviteSuccess}
      />
    </>
  );
};

export default TeamInviteManager;