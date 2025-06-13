
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [shippingInfo, setShippingInfo] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: ""
  });

  // Fetch saved shipping info when dialog opens
  React.useEffect(() => {
    const fetchShippingInfo = async () => {
      if (!user?.id || !isDialogOpen) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('shipping_name, shipping_address, shipping_city, shipping_state, shipping_zip_code, shipping_country')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching shipping info:', error);
        return;
      }
      
      if (data) {
        setShippingInfo({
          name: data.shipping_name || "",
          address: data.shipping_address || "",
          city: data.shipping_city || "",
          state: data.shipping_state || "",
          zipCode: data.shipping_zip_code || "",
          country: data.shipping_country || ""
        });
      }
    };
    
    fetchShippingInfo();
  }, [user?.id, isDialogOpen]);

  const handleConfirmRedeem = () => {
    if (!user) {
      toast.error("You must be logged in to redeem rewards");
      return;
    }
    
    if (!hasDefaultPaymentMethod) {
      toast.error("An Error occurred at this moment, please try again later - Code 0001");
      return;
    }
    
    setIsDialogOpen(true);
  };

  const handleSubmitRedemption = async () => {
    // Validate shipping info
    if (!shippingInfo.name || !shippingInfo.address || !shippingInfo.city || 
        !shippingInfo.state || !shippingInfo.zipCode || !shippingInfo.country) {
      toast.error("Please fill in all shipping information");
      return;
    }
    
    try {
      console.log('Submitting redemption with shipping info:', shippingInfo);
      
      await redeemReward.mutateAsync({
        rewardId: reward.id,
        shippingAddress: shippingInfo
      });
      
      setIsDialogOpen(false);
      onClose();
    } catch (error) {
      console.error("Error redeeming reward:", error);
      // Error is already handled in the mutation's onError callback
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
                          redeemReward.isPending || 
                          isLoadingPaymentMethod || 
                          !hasDefaultPaymentMethod;

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
