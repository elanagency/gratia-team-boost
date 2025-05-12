
import React from "react";
import { TeamStats } from "@/components/team/TeamStats";
import { RewardShop } from "@/components/team/RewardShop";
import { RedemptionHistory } from "@/components/team/RedemptionHistory";

const TeamDashboard = () => {
  return (
    <div className="space-y-8">
      {/* Team member stats */}
      <TeamStats />
      
      {/* Reward Shop */}
      <RewardShop />
      
      {/* Redemption History */}
      <div className="mt-8">
        <RedemptionHistory />
      </div>
    </div>
  );
};

export default TeamDashboard;
