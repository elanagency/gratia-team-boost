
import React, { useState } from "react";
import { useTeamRewards, TeamReward } from "@/hooks/useTeamRewards";
import { SimpleGiftCardGrid } from "./SimpleGiftCardGrid";
import { GiftCardModal } from "./GiftCardModal";
import { Input } from "@/components/ui/input";
import { RealTimeStatus } from "@/components/ui/real-time-status";
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
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Gift Cards Shop</h2>
        <RealTimeStatus />
      </div>
      
      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
        <Input
          placeholder="Search gift cards..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>
      
      {/* Simple Grid */}
      <SimpleGiftCardGrid
        rewards={filteredRewards}
        onSelectReward={handleSelectReward}
        isLoading={isLoading}
        searchTerm={searchTerm}
      />
      
      {/* Modal */}
      <GiftCardModal
        reward={selectedReward}
        isOpen={!!selectedReward}
        onClose={handleCloseDetails}
      />
    </div>
  );
};
