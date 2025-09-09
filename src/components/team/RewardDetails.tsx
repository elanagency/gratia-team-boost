
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Reward } from "@/hooks/useRewards";
import { ArrowLeft } from "lucide-react";
import { useRewards } from "@/hooks/useRewards";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useDefaultPaymentMethod } from "@/hooks/useDefaultPaymentMethod";
import { useUserPoints } from "@/hooks/useUserPoints";
import { ShippingInfoDialog } from "./ShippingInfoDialog";
import { RewardImage } from "./RewardImage";
import { RewardInfo } from "./RewardInfo";

interface RewardDetailsProps {
  reward: Reward;
  onClose: () => void;
}

export const RewardDetails = ({ reward, onClose }: RewardDetailsProps) => {
  const { redeemReward } = useRewards();
  const { user } = useAuth();
  const { hasDefaultPaymentMethod, isLoading: isLoadingPaymentMethod } = useDefaultPaymentMethod();
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

  // Fetch saved shipping info when dialog opens
  React.useEffect(() => {
    const fetchShippingInfo = async () => {
      if (!user?.id || !isDialogOpen) return;
      
      console.log('🔍 Fetching saved shipping info for user:', user.id);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('shipping_name, shipping_address, shipping_city, shipping_state, shipping_zip_code, shipping_country, shipping_phone')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('❌ Error fetching shipping info:', error);
        return;
      }
      
      if (data) {
        console.log('✅ Loaded saved shipping info:', data);
        setShippingInfo({
          name: data.shipping_name || "",
          address: data.shipping_address || "",
          city: data.shipping_city || "",
          state: data.shipping_state || "",
          zipCode: data.shipping_zip_code || "",
          country: data.shipping_country || "",
          phone: data.shipping_phone || ""
        });
      }
    };
    
    fetchShippingInfo();
  }, [user?.id, isDialogOpen]);

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
    
    if (!hasDefaultPaymentMethod) {
      console.log('❌ No default payment method found');
      toast.error("An Error occurred at this moment, please try again later - Code 0001");
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
      
      await redeemReward.mutateAsync({
        rewardId: reward.id,
        shippingAddress: shippingInfo
      });
      
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
                          redeemReward.isPending || 
                          isLoadingPaymentMethod || 
                          isLoadingPoints ||
                          !hasDefaultPaymentMethod ||
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
            hasDefaultPaymentMethod={hasDefaultPaymentMethod}
            isLoadingPaymentMethod={isLoadingPaymentMethod}
            onRedeem={handleConfirmRedeem}
            isRedeemDisabled={isRedeemDisabled}
            isProcessing={redeemReward.isPending}
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
        isProcessing={redeemReward.isPending}
      />
    </div>
  );
};
