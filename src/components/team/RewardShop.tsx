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
  const { recognitionPoints } = useAuth();
  const rate = parseFloat(String(exchangeRate)) || 0.05;
  const balancePoints = recognitionPoints || 0;
  const balanceDollars = balancePoints * rate;
  const formattedPoints = balancePoints.toLocaleString('en-US');
  const formattedDollars = `$${balanceDollars.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
      {/* Available Balance */}
      <div
        style={{
          width: '100%',
          borderRadius: 15,
          border: '1px solid #E8E6F0',
          background: 'linear-gradient(135deg, rgba(127,43,254,0.06), rgba(252,91,255,0.06))',
          padding: '19.75px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span
            style={{
              color: '#9996AA',
              fontSize: 12,
              lineHeight: '18px',
              fontWeight: 500,
              letterSpacing: '0.48px',
              textTransform: 'uppercase',
            }}
          >
            Available Balance
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span
              style={{
                color: '#0F0533',
                fontSize: 28,
                lineHeight: '42px',
                fontWeight: 600,
              }}
            >
              {formattedPoints}
            </span>
            <span
              style={{
                background: '#DCFCE7',
                color: '#15803D',
                fontSize: 13,
                lineHeight: '19.5px',
                fontWeight: 600,
                padding: '4px 13px',
                borderRadius: 999,
              }}
            >
              points
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <span
            style={{
              color: '#9996AA',
              fontSize: 12,
              lineHeight: '18px',
              fontWeight: 400,
              textAlign: 'right',
            }}
          >
            Redemption Value
          </span>
          <span
            style={{
              color: '#0F0533',
              fontSize: 20,
              lineHeight: '30px',
              fontWeight: 600,
              textAlign: 'right',
            }}
          >
            {formattedDollars}
          </span>
        </div>
      </div>

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
