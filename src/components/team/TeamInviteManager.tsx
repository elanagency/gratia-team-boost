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

  // Show billing setup if no team members exist (first member)
  const needsBillingSetup = teamSlots.used === 0;

  if (needsBillingSetup) {
    return <BillingSetupDialog onSetupComplete={onSuccess} />;
  }

  return <InviteTeamMemberDialog onSuccess={onSuccess} />;
};

export default TeamInviteManager;