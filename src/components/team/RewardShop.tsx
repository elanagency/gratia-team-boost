import React, { useState } from "react";
import { useRewardsShop, GiftCard } from "@/hooks/useRewardsShop";
import { SimpleGiftCardGrid } from "./SimpleGiftCardGrid";
import { GiftCardModal } from "./GiftCardModal";
import { RedemptionSuccessDialog } from "./RedemptionSuccessDialog";
import { Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

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
      {/* Search */}
      <div className="relative w-full">
        <Search className="absolute left-[15px] top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
        <input
          placeholder="Search gift cards..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            height: 38,
            borderRadius: 13.375,
            border: '1px solid #E8E6F0',
            background: '#F5F5F7',
            padding: '7.5px 15px 7.5px 33.75px',
            fontSize: 14,
            fontFamily: 'Inter, sans-serif',
            outline: 'none',
          }}
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
