import React from "react";
import { Card, CardContent } from "@/components/ui/card";

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
    <Card 
      className="cursor-pointer transition-all duration-200 hover:bg-muted/50 hover:shadow-md" 
      onClick={onClick}
    >
      <CardContent className="p-4 flex flex-col items-center text-center space-y-3">
        <div className="w-16 h-16 flex items-center justify-center">
          {reward.image_url ? (
            <img 
              src={reward.image_url} 
              alt={reward.name} 
              className="w-full h-full object-contain rounded-lg"
            />
          ) : (
            <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
              <span className="text-xs text-muted-foreground">No image</span>
            </div>
          )}
        </div>
        
        <div className="space-y-1">
          <h3 className="font-medium text-sm leading-tight line-clamp-2">
            {reward.name}
          </h3>
          {reward.brand_name && (
            <p className="text-xs text-muted-foreground">
              {reward.brand_name}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};