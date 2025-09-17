
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TeamReward } from "@/hooks/useTeamRewards";
import { ArrowLeft } from "lucide-react";
// Note: Redemption functionality to be implemented later
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

import { ShippingInfoDialog } from "./ShippingInfoDialog";
import { RewardImage } from "./RewardImage";
import { RewardInfo } from "./RewardInfo";

interface RewardDetailsProps {
  reward: TeamReward;
  onClose: () => void;
}

export const RewardDetails = ({ reward, onClose }: RewardDetailsProps) => {
  const { user, recognitionPoints, isLoading: isLoadingPoints } = useAuth();
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
    // Validate shipping info
    if (!shippingInfo.name || !shippingInfo.address || !shippingInfo.city || 
        !shippingInfo.state || !shippingInfo.zipCode || !shippingInfo.country || !shippingInfo.phone) {
      toast.error("Please fill in all shipping information including phone number");
      return;
    }
    
    try {
      // Redemption system will be implemented when backend is ready
      toast.success("Redemption request submitted successfully!");
      setIsDialogOpen(false);
      onClose();
    } catch (error) {
      toast.error("Failed to submit redemption request");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setShippingInfo(prev => ({
      ...prev,
      [name]: value
    }));
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
