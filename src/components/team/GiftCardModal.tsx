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
import { EmailConfirmationDialog } from "./EmailConfirmationDialog";
import { RewardImage } from "./RewardImage";
import { RewardInfo } from "./RewardInfo";

interface GiftCardModalProps {
  reward: TeamReward | null;
  isOpen: boolean;
  onClose: () => void;
}

export const GiftCardModal = ({ reward, isOpen, onClose }: GiftCardModalProps) => {
  const { user, recognitionPoints, isLoading: isLoadingPoints } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState(user?.email || '');

  if (!reward) return null;

  const hasEnoughPoints = recognitionPoints >= reward.points_cost;

  const handleConfirmRedeem = () => {
    if (!user) {
      toast.error("You must be logged in to redeem rewards");
      return;
    }
    
    if (!hasEnoughPoints) {
      toast.error(`You need ${reward.points_cost} points to redeem this reward. You currently have ${recognitionPoints} points.`);
      return;
    }
    
    setIsDialogOpen(true);
  };

  const handleSubmitRedemption = async () => {
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail);
    if (!isValidEmail) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsProcessing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('goody-redemption-service', {
        body: {
          rewardId: reward.id,
          rewardName: reward.name,
          pointsCost: reward.points_cost,
          recipientEmail: recipientEmail
        }
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        toast.success(`Successfully redeemed ${reward.name}! Gift link sent to ${recipientEmail}`);
        setIsDialogOpen(false);
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

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRecipientEmail(e.target.value);
  };

  const isRedeemDisabled = reward.stock === 0 || 
                          isLoadingPoints ||
                          !hasEnoughPoints;

  return (
    <>
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
                onRedeem={handleConfirmRedeem}
                isRedeemDisabled={isRedeemDisabled}
                isProcessing={isProcessing}
                userPoints={recognitionPoints}
                hasEnoughPoints={hasEnoughPoints}
                isLoadingPoints={isLoadingPoints}
              />
            </div>
          </Card>
        </DialogContent>
      </Dialog>

      <EmailConfirmationDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        recipientEmail={recipientEmail}
        onEmailChange={handleEmailChange}
        onSubmit={handleSubmitRedemption}
        isProcessing={isProcessing}
      />
    </>
  );
};