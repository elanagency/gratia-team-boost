
import React from "react";
import { Card } from "@/components/ui/card";
import RewardCard from "@/components/rewards/RewardCard";
import { useAdminRewardCatalog } from "@/hooks/useAdminRewardCatalog";

const RewardsCatalog = () => {
  const { rewards, isLoadingRewards } = useAdminRewardCatalog();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Gift Cards Catalog</h2>
        <p className="text-gray-500 text-sm mt-1">
          Browse gift cards available from our platform. These are managed centrally and updated regularly.
        </p>
      </div>

      {isLoadingRewards ? (
        <div className="flex justify-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F572FF]"></div>
        </div>
      ) : rewards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rewards.map((reward) => (
            <RewardCard 
              key={reward.id} 
              reward={reward}
              // No onDelete prop - read-only for company admins
            />
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <h3 className="text-lg font-medium text-gray-800">No gift cards available</h3>
          <p className="text-gray-500 mt-2">
            Gift cards are being loaded. Please check back soon!
          </p>
        </Card>
      )}
    </div>
  );
};

export default RewardsCatalog;
