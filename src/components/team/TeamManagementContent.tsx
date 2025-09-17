import React from "react";
import { Card } from "@/components/ui/card";
import TeamMemberTable from "./TeamMemberTable";
import { type CompanyMember as TeamMember } from "@/hooks/useCompanyMembers";

interface TeamManagementContentProps {
  teamMembers: TeamMember[];
  isLoading: boolean;
  isVerifying: boolean;
  currentPage: number;
  totalPages: number;
  totalMembers: number;
  onRemoveMember: (member: TeamMember) => void;
  onPageChange: (page: number) => void;
}

const TeamManagementContent: React.FC<TeamManagementContentProps> = ({
  teamMembers,
  isLoading,
  isVerifying,
  currentPage,
  totalPages,
  totalMembers,
  onRemoveMember,
  onPageChange
}) => {
  return (
    <Card className="dashboard-card">
      {isLoading || isVerifying ? (
        <div className="p-8 text-center">
          {isVerifying ? "Processing subscription setup..." : "Loading team members..."}
        </div>
      ) : (
        <TeamMemberTable 
          teamMembers={teamMembers} 
          onRemoveMember={onRemoveMember}
          currentPage={currentPage}
          totalPages={totalPages}
          totalMembers={totalMembers}
          onPageChange={onPageChange}
        />
      )}
    </Card>
  );
};

export default TeamManagementContent;