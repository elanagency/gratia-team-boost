import React from "react";
import { GiftCard } from "@/hooks/useRewardsShop";
import { RegionBadge } from "./RegionBadge";

interface SimpleGiftCardItemProps {
  reward: GiftCard;
  onClick: () => void;
}

export const SimpleGiftCardItem = ({ reward, onClick }: SimpleGiftCardItemProps) => {
  return (
    <div 
      className="cursor-pointer transition-all duration-300 hover:bg-muted/50 hover:scale-[1.02] rounded-lg p-2" 
      onClick={onClick}
    >
      <div className="flex flex-col items-center text-center space-y-2">
        <div className="relative w-full aspect-[16/10] min-h-[140px] sm:min-h-[160px] flex items-center justify-center rounded-[10px] overflow-hidden">
          {reward.image_url ? (
            <img 
              src={reward.image_url} 
              alt={reward.name} 
              className="w-full h-full object-contain rounded-[10px]"
            />
          ) : (
            <div className="w-full h-full bg-muted rounded-[10px] flex items-center justify-center">
              <span className="text-xs text-muted-foreground">No image</span>
            </div>
          )}
          
          {/* Region Badge in top-right corner */}
          {reward.region_code && (
            <div className="absolute top-1 right-1">
              <RegionBadge regionCode={reward.region_code} size="sm" />
            </div>
          )}
        </div>
        
        <h3 className="font-medium text-sm leading-tight line-clamp-2 px-1">
          {reward.name}
        </h3>
      </div>
    </div>
  );
};
