
import React from "react";

interface RewardImageProps {
  imageUrl: string | null;
  rewardName: string;
}

export const RewardImage = ({ imageUrl, rewardName }: RewardImageProps) => {
  if (imageUrl) {
    return (
      <div className="h-64 md:h-auto overflow-hidden">
        <img 
          src={imageUrl} 
          alt={rewardName} 
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className="h-64 md:h-auto bg-gray-100 flex items-center justify-center">
      <span className="text-gray-400">No image available</span>
    </div>
  );
};
