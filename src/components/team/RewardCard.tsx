
import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Reward } from "@/hooks/useRewards";

interface RewardCardProps {
  reward: Reward;
  onSelect: (reward: Reward) => void;
}

export const RewardCard = ({ reward, onSelect }: RewardCardProps) => {
  return (
    <Card className="overflow-hidden flex flex-col">
      {reward.image_url ? (
        <div className="h-48 overflow-hidden">
          <img 
            src={reward.image_url} 
            alt={reward.name} 
            className="w-full h-full object-cover transition-transform hover:scale-105"
          />
        </div>
      ) : (
        <div className="h-48 bg-gray-100 flex items-center justify-center">
          <span className="text-gray-400">No image available</span>
        </div>
      )}
      
      <div className="p-4 flex-grow">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-lg">{reward.name}</h3>
          <div className="bg-[#F572FF]/10 text-[#F572FF] px-2 py-1 rounded font-medium">
            {reward.points_cost} points
          </div>
        </div>
        
        {reward.description && (
          <p className="text-gray-500 text-sm mt-2 line-clamp-2">
            {reward.description}
          </p>
        )}
      </div>
      
      <div className="p-4 pt-0">
        <Button 
          onClick={() => onSelect(reward)} 
          className="w-full bg-[#F572FF] hover:bg-[#F572FF]/90"
        >
          Redeem
        </Button>
      </div>
    </Card>
  );
};
