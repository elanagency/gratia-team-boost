
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Reward } from "@/hooks/useRewards";
import { ArrowLeft } from "lucide-react";
import { useRewards } from "@/hooks/useRewards";
import { useAuth } from "@/context/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface RewardDetailsProps {
  reward: Reward;
  onClose: () => void;
}

export const RewardDetails = ({ reward, onClose }: RewardDetailsProps) => {
  const { redeemReward } = useRewards();
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [shippingInfo, setShippingInfo] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: ""
  });

  const handleConfirmRedeem = () => {
    if (!user) {
      toast.error("You must be logged in to redeem rewards");
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
      await redeemReward.mutateAsync({
        rewardId: reward.id,
        shippingAddress: shippingInfo
      });
      
      setIsDialogOpen(false);
      onClose();
    } catch (error) {
      console.error("Error redeeming reward:", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setShippingInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

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
                disabled={reward.stock === 0}
                className="w-full bg-[#F572FF] hover:bg-[#F572FF]/90 text-white"
              >
                Redeem Reward
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
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Input 
                id="address" 
                name="address" 
                value={shippingInfo.address} 
                onChange={handleInputChange}
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
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="state">State</Label>
                <Input 
                  id="state" 
                  name="state" 
                  value={shippingInfo.state} 
                  onChange={handleInputChange}
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
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="country">Country</Label>
                <Input 
                  id="country" 
                  name="country" 
                  value={shippingInfo.country} 
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitRedemption}
              className="bg-[#F572FF] hover:bg-[#F572FF]/90"
              disabled={redeemReward.isPending}
            >
              {redeemReward.isPending ? "Processing..." : "Confirm Redemption"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
