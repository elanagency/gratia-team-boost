import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTeamMembers } from "@/hooks/useCompanyMembers";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
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

  // Check if billing setup is needed based on billing_ready status
  const needsBillingSetup = !teamSlots.billing_ready;

  const handleInviteClick = () => {
    if (needsBillingSetup) {
      setBillingDialogOpen(true);
    } else {
      setInviteDialogOpen(true);
    }
  };

  const handleBillingSetupComplete = () => {
    setBillingDialogOpen(false);
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
        className="bg-[#F572FF] hover:bg-[#E061EE] text-white"
        onClick={handleInviteClick}
      >
        <PlusCircle className="mr-2 h-4 w-4" />
        Invite Team Member
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