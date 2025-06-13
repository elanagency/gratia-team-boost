
import React from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Reward } from "@/hooks/useRewards";

interface RewardInfoProps {
  reward: Reward;
  hasDefaultPaymentMethod: boolean;
  isLoadingPaymentMethod: boolean;
  onRedeem: () => void;
  isRedeemDisabled: boolean;
  isProcessing: boolean;
}

export const RewardInfo = ({
  reward,
  hasDefaultPaymentMethod,
  isLoadingPaymentMethod,
  onRedeem,
  isRedeemDisabled,
  isProcessing
}: RewardInfoProps) => {
  return (
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
          onClick={onRedeem}
          disabled={isRedeemDisabled}
          className="w-full bg-[#F572FF] hover:bg-[#F572FF]/90 text-white"
        >
          {isProcessing ? "Processing..." : 
           isLoadingPaymentMethod ? "Loading..." :
           !hasDefaultPaymentMethod ? "Payment Method Required" :
           "Redeem Reward"}
        </Button>
        
        <p className="text-xs text-gray-500 mt-2 text-center">
          Redeeming this reward will deduct {reward.points_cost} points from your balance
        </p>
      </div>
    </div>
  );
};
