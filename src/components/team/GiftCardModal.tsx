import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { TeamReward } from "@/hooks/useTeamRewards";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { RewardImage } from "./RewardImage";
import { RewardInfo } from "./RewardInfo";

interface GiftCardModalProps {
  reward: TeamReward | null;
  isOpen: boolean;
  onClose: () => void;
}

export const GiftCardModal = ({ reward, isOpen, onClose }: GiftCardModalProps) => {
  const { user, recognitionPoints, isLoading: isLoadingPoints } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  if (!reward) return null;

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
        toast.success(`Successfully redeemed $${dollarAmount} ${reward.name}! Gift link sent to ${recipientEmail}`);
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
            />
          </div>
        </Card>
      </DialogContent>
    </Dialog>
  );
};