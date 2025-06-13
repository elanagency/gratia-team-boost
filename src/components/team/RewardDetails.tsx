
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Reward } from "@/hooks/useRewards";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { useRewards } from "@/hooks/useRewards";
import { useAuth } from "@/context/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useDefaultPaymentMethod } from "@/hooks/useDefaultPaymentMethod";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
          {reward.image_url ? (
            <div className="h-64 md:h-auto overflow-hidden">
              <img 
                src={reward.image_url} 
                alt={reward.name} 
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="h-64 md:h-auto bg-gray-100 flex items-center justify-center">
              <span className="text-gray-400">No image available</span>
            </div>
          )}
          
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold">{reward.name}</h2>
              <div className="bg-[#F572FF]/10 text-[#F572FF] px-3 py-2 rounded-md font-semibold">
                {reward.points_cost} points
              </div>
            </div>
            
            {reward.description && (
              <p className="text-gray-600 mb-6">
                {reward.description}
              </p>
            )}
            
            {!hasDefaultPaymentMethod && !isLoadingPaymentMethod && (
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  An Error occurred at this moment, please try again later - Code 0001
                </AlertDescription>
              </Alert>
            )}
            
            <div className="mt-4">
              {reward.stock !== null && (
                <p className="text-sm text-gray-500 mb-4">
                  {reward.stock > 0 
                    ? `${reward.stock} in stock` 
                    : "Currently out of stock"}
                </p>
              )}
              
              <Button 
                onClick={handleConfirmRedeem}
                disabled={isRedeemDisabled}
                className="w-full bg-[#F572FF] hover:bg-[#F572FF]/90 text-white"
              >
                {redeemReward.isPending ? "Processing..." : 
                 isLoadingPaymentMethod ? "Loading..." :
                 !hasDefaultPaymentMethod ? "Payment Method Required" :
                 "Redeem Reward"}
              </Button>
              
              <p className="text-xs text-gray-500 mt-2 text-center">
                Redeeming this reward will deduct {reward.points_cost} points from your balance
              </p>
            </div>
          </div>
        </div>
      </Card>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Enter Shipping Information</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                name="name" 
                value={shippingInfo.name} 
                onChange={handleInputChange}
                placeholder="Full name for shipping"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Input 
                id="address" 
                name="address" 
                value={shippingInfo.address} 
                onChange={handleInputChange}
                placeholder="Street address"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="city">City</Label>
                <Input 
                  id="city" 
                  name="city" 
                  value={shippingInfo.city} 
                  onChange={handleInputChange}
                  placeholder="City"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="state">State</Label>
                <Input 
                  id="state" 
                  name="state" 
                  value={shippingInfo.state} 
                  onChange={handleInputChange}
                  placeholder="State"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="zipCode">Zip Code</Label>
                <Input 
                  id="zipCode" 
                  name="zipCode" 
                  value={shippingInfo.zipCode} 
                  onChange={handleInputChange}
                  placeholder="Zip code"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="country">Country</Label>
                <Input 
                  id="country" 
                  name="country" 
                  value={shippingInfo.country} 
                  onChange={handleInputChange}
                  placeholder="Country"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              disabled={redeemReward.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitRedemption}
              className="bg-[#F572FF] hover:bg-[#F572FF]/90"
              disabled={redeemReward.isPending}
            >
              {redeemReward.isPending ? "Processing Redemption..." : "Confirm Redemption"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
