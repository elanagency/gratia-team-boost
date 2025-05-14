
import React from "react";
import { TeamStats } from "@/components/team/TeamStats";
import { RewardShop } from "@/components/team/RewardShop";
import { RedemptionHistory } from "@/components/team/RedemptionHistory";
import { PointsHistory } from "@/components/points/PointsHistory";

const TeamDashboard = () => {
  return (
    <div className="space-y-8">
      {/* Team member stats */}
      <TeamStats />
      
      {/* Points History - Personal transactions */}
      <PointsHistory personalView={true} />
      
      {/* Reward Shop */}
      <RewardShop />
      
      {/* Redemption History */}
      <RedemptionHistory />
    </div>
  );
};

export default TeamDashboard;
