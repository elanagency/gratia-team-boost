
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TeamReward } from "@/hooks/useTeamRewards";
import { ArrowLeft } from "lucide-react";
// Note: Redemption functionality to be implemented later
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUserPoints } from "@/hooks/useUserPoints";
import { ShippingInfoDialog } from "./ShippingInfoDialog";
import { RewardImage } from "./RewardImage";
import { RewardInfo } from "./RewardInfo";

interface RewardDetailsProps {
  reward: TeamReward;
  onClose: () => void;
}

export const RewardDetails = ({ reward, onClose }: RewardDetailsProps) => {
  // TODO: Implement redemption with new gift card system
  const { user } = useAuth();
  const { recognitionPoints, isLoading: isLoadingPoints } = useUserPoints();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [shippingInfo, setShippingInfo] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    phone: ""
  });

  // Check if user has enough points
  const hasEnoughPoints = recognitionPoints >= reward.points_cost;

  // Note: Shipping info is now collected at redemption time only

  const handleConfirmRedeem = () => {
    console.log('🎯 Redeem button clicked for reward:', reward.id);
    
    if (!user) {
      console.log('❌ No user logged in');
      toast.error("You must be logged in to redeem rewards");
      return;
    }
    
    if (!hasEnoughPoints) {
      console.log('❌ Not enough points');
      toast.error(`You need ${reward.points_cost} points to redeem this reward. You currently have ${recognitionPoints} points.`);
      return;
    }
    
    
    console.log('✅ Opening shipping info dialog');
    setIsDialogOpen(true);
  };

  const handleSubmitRedemption = async () => {
    console.log('📦 Submitting redemption with shipping info:', shippingInfo);
    
    // Validate shipping info
    if (!shippingInfo.name || !shippingInfo.address || !shippingInfo.city || 
        !shippingInfo.state || !shippingInfo.zipCode || !shippingInfo.country || !shippingInfo.phone) {
      console.log('❌ Validation failed - missing required fields');
      toast.error("Please fill in all shipping information including phone number");
      return;
    }
    
    try {
      console.log('🚀 Starting redemption mutation...');
      console.log('📋 Redemption payload:', {
        rewardId: reward.id,
        shippingAddress: shippingInfo
      });
      
      // TODO: Implement actual redemption flow
      console.log('Redemption will be implemented later');
      
      console.log('✅ Redemption completed successfully');
      setIsDialogOpen(false);
      onClose();
    } catch (error) {
      console.error("❌ Error redeeming reward:", error);
      // Error is already handled in the mutation's onError callback
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    console.log('📝 Shipping info field changed:', name, '=', value);
    setShippingInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const isRedeemDisabled = reward.stock === 0 || 
                          false || // redeemReward.isPending - to be implemented
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
            isProcessing={false} // redeemReward.isPending - to be implemented
            userPoints={recognitionPoints}
            hasEnoughPoints={hasEnoughPoints}
            isLoadingPoints={isLoadingPoints}
          />
        </div>
      </Card>
      
      <ShippingInfoDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        shippingInfo={shippingInfo}
        onShippingInfoChange={handleInputChange}
        onSubmit={handleSubmitRedemption}
        isProcessing={false} // redeemReward.isPending - to be implemented
      />
    </div>
  );
};
