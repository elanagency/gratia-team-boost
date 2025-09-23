
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TeamReward } from "@/hooks/useTeamRewards";
import { ArrowLeft } from "lucide-react";
// Note: Redemption functionality to be implemented later
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

import { EmailConfirmationDialog } from "./EmailConfirmationDialog";
import { RewardImage } from "./RewardImage";
import { RewardInfo } from "./RewardInfo";

interface RewardDetailsProps {
  reward: TeamReward;
  onClose: () => void;
}

export const RewardDetails = ({ reward, onClose }: RewardDetailsProps) => {
  const { user, recognitionPoints, isLoading: isLoadingPoints } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState(user?.email || '');

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
    // Validate email
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
        onClose(); // Close the reward details view
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
            onRedeem={handleConfirmRedeem}
            isRedeemDisabled={isRedeemDisabled}
            isProcessing={isProcessing}
            userPoints={recognitionPoints}
            hasEnoughPoints={hasEnoughPoints}
            isLoadingPoints={isLoadingPoints}
          />
        </div>
      </Card>
      
      <EmailConfirmationDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        recipientEmail={recipientEmail}
        onEmailChange={handleEmailChange}
        onSubmit={handleSubmitRedemption}
        isProcessing={isProcessing}
      />
    </div>
  );
};
