
import React from "react";
import { GivePointsCard } from "@/components/points/GivePointsCard";
import { RecognitionFeed } from "@/components/points/RecognitionFeed";
import { LeaderboardCard } from "@/components/points/LeaderboardCard";

const Dashboard = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-xl sm:text-2xl font-bold">Dashboard</h1>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-fit">
        {/* Left Column - Give Points Card */}
        <div className="h-full">
          <GivePointsCard />
        </div>
        
        {/* Right Column - Recognition Feed */}
        <div className="h-full">
          <RecognitionFeed />
        </div>
      </div>
      
      {/* Bottom Section - Full Width Leaderboard */}
      <div>
        <LeaderboardCard />
      </div>
    </div>
  );
};

export default Dashboard;
