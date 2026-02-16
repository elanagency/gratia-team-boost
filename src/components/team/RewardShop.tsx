
import React, { useState } from "react";
import { useRewardsShop, GiftCard } from "@/hooks/useRewardsShop";
import { SimpleGiftCardGrid } from "./SimpleGiftCardGrid";
import { GiftCardModal } from "./GiftCardModal";
import { RedemptionSuccessDialog } from "./RedemptionSuccessDialog";
import { Input } from "@/components/ui/input";
import { RealTimeStatus } from "@/components/ui/real-time-status";
import { Search } from "lucide-react";

export const RewardShop = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedReward, setSelectedReward] = useState<GiftCard | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [redemptionData, setRedemptionData] = useState<{
    brandName: string;
    dollarAmount: number;
    pointsSpent: number;
    giftLink?: string;
  } | null>(null);
  
  const { giftCards, exchangeRate, isLoading, error } = useRewardsShop();

  // Filter rewards based on search term
  const filteredRewards = giftCards.filter(reward => {
    return reward.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (reward.description && reward.description.toLowerCase().includes(searchTerm.toLowerCase()));
  });
  
  const handleSelectReward = (reward: GiftCard) => {
    setSelectedReward(reward);
  };

  const handleCloseDetails = () => {
    setSelectedReward(null);
  };

  const handleRedemptionSuccess = (data: {
    brandName: string;
    dollarAmount: number;
    pointsSpent: number;
    giftLink?: string;
  }) => {
    setRedemptionData(data);
    setShowSuccessDialog(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Gift Cards Shop</h2>
        <RealTimeStatus />
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
        <Input
          placeholder="Search gift cards..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>
      
      {/* Simple Grid */}
      <SimpleGiftCardGrid
        rewards={filteredRewards}
        onSelectReward={handleSelectReward}
        isLoading={isLoading}
        searchTerm={searchTerm}
        error={error}
      />
      
      {/* Modal */}
      <GiftCardModal
        reward={selectedReward}
        isOpen={!!selectedReward}
        onClose={handleCloseDetails}
        exchangeRate={exchangeRate}
        onRedemptionSuccess={handleRedemptionSuccess}
      />

      {/* Success Dialog */}
      {redemptionData && (
        <RedemptionSuccessDialog
          open={showSuccessDialog}
          onOpenChange={setShowSuccessDialog}
          brandName={redemptionData.brandName}
          dollarAmount={redemptionData.dollarAmount}
          pointsSpent={redemptionData.pointsSpent}
          giftLink={redemptionData.giftLink}
        />
      )}
    </div>
  );
};