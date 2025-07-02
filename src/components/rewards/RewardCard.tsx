
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface Reward {
  id: string;
  name: string;
  description: string;
  points_cost: number;
  image_url: string;
  stock?: number;
  company_id?: string | null;
}

interface RewardCardProps {
  reward: Reward;
  onDelete?: (reward: Reward) => void;
}

export const RewardCard = ({ reward, onDelete }: RewardCardProps) => {
  // Format price from cents to dollars
  const formatPrice = (points: number) => {
    return `$${(points / 100).toFixed(2)}`;
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
        <h3 className="font-semibold text-lg">{reward.name}</h3>
        <div className="bg-[#F572FF]/10 text-[#F572FF] px-2 py-1 rounded font-medium mt-1 inline-block">
          {reward.points_cost} points
        </div>
        
        {reward.description && (
          <p className="text-gray-500 text-sm mt-2 line-clamp-2">
            {reward.description}
          </p>
        )}
        <div className="mt-1 text-sm text-gray-500">
          Price equivalent: {formatPrice(reward.points_cost)}
        </div>
        
        {onDelete && (
          <div className="mt-3 flex justify-end">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-red-500 border-red-300 hover:bg-red-50 hover:text-red-600"
              onClick={() => onDelete(reward)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RewardCard;
