
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUserPoints } from "@/hooks/useUserPoints";

interface RewardCardProps {
  reward: {
    id: string;
    name: string;
    description: string | null;
    image_url: string | null;
    points_cost: number;
    stock: number | null;
    company_id?: string | null;
  };
  onClick: () => void;
}

export const RewardCard = ({ reward, onClick }: RewardCardProps) => {
  const { recognitionPoints, isLoading: isLoadingPoints } = useUserPoints();
  const hasEnoughPoints = recognitionPoints >= reward.points_cost;

  return (
    <Card className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow" onClick={onClick}>
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
        <h3 className="font-semibold text-lg mb-2">{reward.name}</h3>
        
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary" className="bg-[#F572FF]/10 text-[#F572FF] hover:bg-[#F572FF]/20">
            {reward.points_cost} points
          </Badge>
          
          {!isLoadingPoints && !hasEnoughPoints && (
            <Badge variant="destructive" className="text-xs">
              Insufficient Points
            </Badge>
          )}
        </div>
        
        {reward.description && (
          <p className="text-gray-500 text-sm line-clamp-2 mb-3">
            {reward.description}
          </p>
        )}
        
        {reward.stock !== null && (
          <p className="text-xs text-gray-500 mb-3">
            {reward.stock > 0 
              ? `${reward.stock} in stock` 
              : "Out of stock"}
          </p>
        )}
        
        <Button 
          className={`w-full ${
            hasEnoughPoints && !isLoadingPoints
              ? "bg-[#F572FF] hover:bg-[#F572FF]/90 text-white" 
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
          disabled={!hasEnoughPoints || isLoadingPoints || reward.stock === 0}
          onClick={(e) => {
            e.stopPropagation();
            if (hasEnoughPoints && !isLoadingPoints && reward.stock !== 0) {
              onClick();
            }
          }}
        >
          {isLoadingPoints ? "Loading..." : 
           reward.stock === 0 ? "Out of Stock" :
           !hasEnoughPoints ? "Insufficient Points" : 
           "View Details"}
        </Button>
      </CardContent>
    </Card>
  );
};
