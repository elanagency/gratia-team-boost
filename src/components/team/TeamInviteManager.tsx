import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useTeamMembers } from "@/hooks/useCompanyMembers";
import BillingSetupDialog from "./BillingSetupDialog";
import InviteTeamMemberDialog from "./InviteTeamMemberDialog";

interface TeamInviteManagerProps {
  onSuccess: () => void;
}

const TeamInviteManager = ({ onSuccess }: TeamInviteManagerProps) => {
  const { companyId } = useAuth();
  const { teamSlots } = useTeamMembers();

  // Check if billing setup is needed based on billing_ready status
  const needsBillingSetup = !teamSlots.billing_ready;

  if (needsBillingSetup) {
    return <BillingSetupDialog onSetupComplete={onSuccess} />;
  }

  return <InviteTeamMemberDialog onSuccess={onSuccess} />;
};

export default TeamInviteManager;