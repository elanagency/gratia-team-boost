
import React from "react";
import { GivePointsCard } from "@/components/points/GivePointsCard";
import { RecognitionFeed } from "@/components/points/RecognitionFeed";
import { LeaderboardCard } from "@/components/points/LeaderboardCard";

const TeamDashboard = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/5">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-accent bg-clip-text text-transparent">
              Team Recognition
            </h1>
            <p className="text-muted-foreground mt-1">Celebrate achievements and give recognition</p>
          </div>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Left Column - Give Points Card */}
          <div className="order-2 xl:order-1">
            <GivePointsCard />
          </div>
          
          {/* Right Column - Recognition Feed */}
          <div className="order-1 xl:order-2">
            <RecognitionFeed />
          </div>
        </div>
        
        {/* Bottom Section - Full Width Leaderboard */}
        <div className="mt-8">
          <LeaderboardCard />
        </div>
      </div>
    </div>
  );
};

export default TeamDashboard;
