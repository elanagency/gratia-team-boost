import React from "react";
import InviteTeamMemberDialog from "./InviteTeamMemberDialog";

interface TeamManagementHeaderProps {
  onInviteSuccess?: () => void;
}

const TeamManagementHeader: React.FC<TeamManagementHeaderProps> = ({ 
  onInviteSuccess 
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <h1 className="text-2xl font-semibold text-gray-800 mb-4 sm:mb-0">
        Team Management
      </h1>
      
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <InviteTeamMemberDialog onSuccess={onInviteSuccess} />
      </div>
    </div>
  );
};

export default TeamManagementHeader;