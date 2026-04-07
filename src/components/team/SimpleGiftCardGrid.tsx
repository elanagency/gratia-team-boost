import React from "react";
import { GiftCard } from "@/hooks/useRewardsShop";
import { SimpleGiftCardItem } from "./SimpleGiftCardItem";
import { Card } from "@/components/ui/card";

interface SimpleGiftCardGridProps {
  rewards: GiftCard[];
  onSelectReward: (reward: GiftCard) => void;
  isLoading: boolean;
  searchTerm: string;
  error?: Error | null;
}

export const SimpleGiftCardGrid = ({ 
  rewards, 
  onSelectReward, 
  isLoading, 
  searchTerm,
  error 
}: SimpleGiftCardGridProps) => {
  if (isLoading) {
    return (
      <div className="flex justify-center my-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-12 text-center">
        <h3 className="text-lg font-medium text-foreground">A problem occurred</h3>
        <p className="text-muted-foreground mt-2">Try again later</p>
      </Card>
    );
  }

  if (rewards.length === 0) {
    return (
      <Card className="p-12 text-center">
        <h3 className="text-lg font-medium text-foreground">No gift cards found</h3>
        <p className="text-muted-foreground mt-2">
          {searchTerm 
            ? "Try a different search term" 
            : "Check back soon for new gift cards!"}
        </p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {rewards.map((reward) => (
        <SimpleGiftCardItem 
          key={reward.id} 
          reward={reward} 
          onClick={() => onSelectReward(reward)}
        />
      ))}
    </div>
  );
};