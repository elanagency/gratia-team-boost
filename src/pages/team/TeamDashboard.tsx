
import React from "react";
import { TeamStats } from "@/components/team/TeamStats";
import { RedemptionHistory } from "@/components/team/RedemptionHistory";
import { PointsHistory } from "@/components/points/PointsHistory";
import { GivePointsDialog } from "@/components/points/GivePointsDialog";

const TeamDashboard = () => {
  return (
    <div className="space-y-8">
      {/* Header with Give Points button */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-xl sm:text-2xl font-bold">Dashboard</h1>
        <div className="flex-shrink-0">
          <GivePointsDialog isTeamMember={true} />
        </div>
      </div>

      {/* Team member stats */}
      <TeamStats />
      
      {/* Points History - Personal transactions */}
      <PointsHistory personalView={true} />
      
      {/* Redemption History */}
      <RedemptionHistory />
    </div>
  );
};

export default TeamDashboard;
