
import React from "react";
import { PointsHistory } from "@/components/points/PointsHistory";
import { GivePointsDialog } from "@/components/points/GivePointsDialog";
import { MonthlyLeaderboardCard } from "@/components/team/MonthlyLeaderboardCard";

const TeamRecognition = () => {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Recognition</h1>
        <div className="flex-shrink-0">
          <GivePointsDialog isTeamMember={true} />
        </div>
      </div>
      
      {/* Monthly Leaderboard Card */}
      <MonthlyLeaderboardCard />
      
      <PointsHistory personalView={true} />
    </div>
  );
};

export default TeamRecognition;
