
import React, { useState } from "react";
import { useTeamRewards, TeamReward } from "@/hooks/useTeamRewards";
import { RewardCard } from "./RewardCard";
import { RewardDetails } from "./RewardDetails";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export const RewardShop = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedReward, setSelectedReward] = useState<TeamReward | null>(null);
  
  const { rewards, isLoading } = useTeamRewards();
  
  // Filter rewards based on search term
  const filteredRewards = rewards.filter(reward => 
    reward.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (reward.description && reward.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const handleSelectReward = (reward: TeamReward) => {
    setSelectedReward(reward);
  };

  const handleCloseDetails = () => {
    setSelectedReward(null);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Gift Cards Shop</h2>
      
      {selectedReward ? (
        <RewardDetails 
          reward={selectedReward} 
          onClose={handleCloseDetails}
        />
      ) : (
        <>
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Search gift cards..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Rewards grid */}
          {isLoading ? (
            <div className="flex justify-center my-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F572FF]"></div>
            </div>
          ) : filteredRewards.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRewards.map((reward) => (
                <RewardCard 
                  key={reward.id} 
                  reward={reward} 
                  onClick={() => handleSelectReward(reward)}
                />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <h3 className="text-lg font-medium text-gray-800">No gift cards found</h3>
              <p className="text-gray-500 mt-2">
                {searchTerm 
                  ? "Try a different search term" 
                  : "Check back soon for new gift cards!"}
              </p>
            </Card>
          )}
        </>
      )}
    </div>
  );
};
