
import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface Reward {
  id: string;
  name: string;
  description: string;
  points_cost: number;
  image_url: string;
  stock?: number;
}

interface RewardCardProps {
  reward: Reward;
}

export const RewardCard = ({ reward }: RewardCardProps) => {
  // Format price from cents to dollars
  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <Card className="overflow-hidden">
      <div className="h-48 overflow-hidden">
        {reward.image_url ? (
          <img 
            src={reward.image_url} 
            alt={reward.name} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="h-full bg-gray-100 flex items-center justify-center">
            <span className="text-gray-400">No image available</span>
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
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
        <div className="mt-1 text-sm text-gray-500">
          Price equivalent: {formatPrice(reward.points_cost)}
        </div>
      </CardContent>
    </Card>
  );
};

export default RewardCard;
