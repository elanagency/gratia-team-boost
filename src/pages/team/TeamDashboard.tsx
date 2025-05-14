
import React from "react";
import { TeamStats } from "@/components/team/TeamStats";
import { RedemptionHistory } from "@/components/team/RedemptionHistory";

const TeamDashboard = () => {
  return (
    <div className="space-y-8">
      {/* Team member stats */}
      <TeamStats />
      
      {/* Redemption History */}
      <RedemptionHistory />
    </div>
  );
};

export default TeamDashboard;
