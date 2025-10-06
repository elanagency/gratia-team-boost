
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GiftCard } from "@/hooks/useRewardsShop";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { RewardImage } from "./RewardImage";
import { RewardInfo } from "./RewardInfo";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import { RedemptionSuccessDialog } from "./RedemptionSuccessDialog";

interface RewardDetailsProps {
  reward: GiftCard;
  onClose: () => void;
}

export const RewardDetails = ({ reward, onClose }: RewardDetailsProps) => {
  const { user, recognitionPoints, isLoading: isLoadingPoints } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [redemptionData, setRedemptionData] = useState<{
    brandName: string;
    dollarAmount: number;
    pointsSpent: number;
    giftLink?: string;
  } | null>(null);
  const { pointExchangeRate } = usePlatformSettings();
  const exchangeRate = pointExchangeRate?.toString() || '0.03';

  const handleRedeem = async (dollarAmount: number, recipientEmail: string) => {
    if (!user) {
      toast.error("You must be logged in to redeem rewards");
      return;
    }

    setIsProcessing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('goody-redemption-service', {
        body: {
          rewardId: reward.id,
          rewardName: reward.name,
          dollarAmount: dollarAmount,
          recipientEmail: recipientEmail
        }
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        const pointsSpent = Math.ceil(dollarAmount / parseFloat(exchangeRate));
        
        setRedemptionData({
          brandName: reward.name,
          dollarAmount: dollarAmount,
          pointsSpent: pointsSpent,
          giftLink: data.giftLink
        });
        
        setShowSuccessDialog(true);
        onClose();
      } else {
        throw new Error(data?.error || 'Redemption failed');
      }
    } catch (error: any) {
      console.error('Redemption error:', error);
      toast.error(error.message || 'Failed to redeem reward');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <Button 
          variant="ghost" 
          onClick={onClose} 
          className="mb-4 hover:bg-transparent pl-0"
        >
          <ArrowLeft className="mr-2" size={18} />
          Back to Rewards
        </Button>
        
        <Card className="overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <RewardImage 
              imageUrl={reward.image_url} 
              rewardName={reward.name} 
            />
            
            <RewardInfo
              reward={reward}
              onRedeem={handleRedeem}
              isProcessing={isProcessing}
              userPoints={recognitionPoints}
              isLoadingPoints={isLoadingPoints}
              exchangeRate={exchangeRate}
            />
          </div>
        </Card>
      </div>

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
    </>
  );
};
