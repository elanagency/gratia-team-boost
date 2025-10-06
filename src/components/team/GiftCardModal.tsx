import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { GiftCard } from "@/hooks/useRewardsShop";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { RewardImage } from "./RewardImage";
import { RewardInfo } from "./RewardInfo";

interface GiftCardModalProps {
  reward: GiftCard | null;
  isOpen: boolean;
  onClose: () => void;
  exchangeRate: string;
  onRedemptionSuccess?: (data: {
    brandName: string;
    dollarAmount: number;
    pointsSpent: number;
    giftLink?: string;
  }) => void;
}

export const GiftCardModal = ({ reward, isOpen, onClose, exchangeRate, onRedemptionSuccess }: GiftCardModalProps) => {
  const { user, recognitionPoints, isLoading: isLoadingPoints, firstName, lastName } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  if (!reward) return null;

  const handleRedeem = async (dollarAmount: number, recipientEmail: string, recipientFirstName: string, recipientLastName: string) => {
    if (!user) {
      toast.error("You must be logged in to redeem rewards");
      return;
    }

    setIsProcessing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('goody-redemption-service', {
        body: {
          rewardId: reward.external_id,
          rewardName: reward.name,
          dollarAmount: dollarAmount,
          recipientEmail: recipientEmail,
          recipientFirstName: recipientFirstName,
          recipientLastName: recipientLastName
        }
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        const pointsSpent = Math.ceil(dollarAmount / parseFloat(exchangeRate));
        
        // Call success callback if provided
        if (onRedemptionSuccess) {
          onRedemptionSuccess({
            brandName: reward.name,
            dollarAmount: dollarAmount,
            pointsSpent: pointsSpent,
            giftLink: data.giftLink
          });
        }
        
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{reward.name}</DialogTitle>
        </DialogHeader>
        
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
              currentUserFirstName={firstName}
              currentUserLastName={lastName}
            />
          </div>
        </Card>
      </DialogContent>
    </Dialog>
  );
};