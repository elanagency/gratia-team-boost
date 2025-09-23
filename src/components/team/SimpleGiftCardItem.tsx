import React from "react";

interface SimpleGiftCardItemProps {
  reward: {
    id: string;
    name: string;
    image_url: string;
    brand_name?: string;
  };
  onClick: () => void;
}

export const SimpleGiftCardItem = ({ reward, onClick }: SimpleGiftCardItemProps) => {
  return (
    <div 
      className="cursor-pointer transition-all duration-300 hover:bg-muted/50 hover:scale-105 rounded-lg p-2" 
      onClick={onClick}
    >
      <div className="flex flex-col items-center text-center space-y-3">
        <div className="w-[214px] h-[134px] flex items-center justify-center rounded-xl overflow-hidden">
          {reward.image_url ? (
            <img 
              src={reward.image_url} 
              alt={reward.name} 
              className="w-full h-full object-contain rounded-xl"
            />
          ) : (
            <div className="w-full h-full bg-muted rounded-xl flex items-center justify-center">
              <span className="text-xs text-muted-foreground">No image</span>
            </div>
          )}
        </div>
        
        <h3 className="font-medium text-sm leading-tight line-clamp-2">
          {reward.name}
        </h3>
      </div>
    </div>
  );
};