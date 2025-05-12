
import React, { useState } from "react";
import { useRewards, Reward } from "@/hooks/useRewards";
import { RewardCard } from "./RewardCard";
import { RewardDetails } from "./RewardDetails";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const RewardShop = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  
  const { rewards, categories, isLoading } = useRewards(selectedCategory || undefined);
  
  // Filter rewards based on search term
  const filteredRewards = rewards.filter(reward => 
    reward.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (reward.description && reward.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const handleSelectReward = (reward: Reward) => {
    setSelectedReward(reward);
  };

  const handleCloseDetails = () => {
    setSelectedReward(null);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Rewards Shop</h2>
      
      {selectedReward ? (
        <RewardDetails 
          reward={selectedReward} 
          onClose={handleCloseDetails}
        />
      ) : (
        <>
          {/* Search and filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder="Search rewards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="w-full sm:w-48">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
                  onSelect={handleSelectReward}
                />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <h3 className="text-lg font-medium text-gray-800">No rewards found</h3>
              <p className="text-gray-500 mt-2">
                {searchTerm 
                  ? "Try a different search term or category" 
                  : "Check back soon for new rewards!"}
              </p>
            </Card>
          )}
        </>
      )}
    </div>
  );
};
