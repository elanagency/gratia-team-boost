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

  // Always show "Invite Team Member" button, but determine which dialog to show
  const needsBillingSetup = teamSlots.used === 0;

  if (needsBillingSetup) {
    return <BillingSetupDialog onSetupComplete={onSuccess} />;
  }

  return <InviteTeamMemberDialog onSuccess={onSuccess} />;
};

export default TeamInviteManager;