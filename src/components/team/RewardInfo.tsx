
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Check } from "lucide-react";
import { TeamReward } from "@/hooks/useTeamRewards";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import { calculatePointsFromPrice } from "@/lib/utils";

interface RewardInfoProps {
  reward: TeamReward;
  onRedeem: (amount: number, email: string) => void;
  isProcessing: boolean;
  userPoints: number;
  isLoadingPoints: boolean;
}

export const RewardInfo = ({
  reward,
  onRedeem,
  isProcessing,
  userPoints,
  isLoadingPoints
}: RewardInfoProps) => {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [recipientEmail, setRecipientEmail] = useState("");
  const { getSetting } = usePlatformSettings();
  
  const exchangeRate = getSetting('points_to_dollar_exchange_rate') || '0.01';
  
  const dollarAmounts = [10, 20, 50, 100];
  
  // Calculate points for each dollar amount
  const getPointsForAmount = (dollarAmount: number) => {
    return calculatePointsFromPrice(dollarAmount * 100, exchangeRate); // Convert to cents
  };
  
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail);
  const selectedAmountPoints = selectedAmount ? getPointsForAmount(selectedAmount) : 0;
  const hasEnoughPointsForSelected = selectedAmountPoints <= userPoints;
  
  const isRedeemDisabled = !selectedAmount || !isValidEmail || isLoadingPoints || !hasEnoughPointsForSelected || isProcessing;
  
  const handleRedeem = () => {
    if (selectedAmount && isValidEmail && hasEnoughPointsForSelected) {
      onRedeem(selectedAmount, recipientEmail);
    }
  };
  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-2xl font-bold">{reward.name}</h2>
      </div>
      
      {/* User Points Display */}
      <div className="mb-4 p-3 bg-muted rounded-md">
        <p className="text-sm text-muted-foreground">
          Your current points: <span className="font-semibold text-primary">
            {isLoadingPoints ? "Loading..." : `${userPoints.toLocaleString()} points`}
          </span>
        </p>
      </div>
      
      {reward.description && (
        <p className="text-muted-foreground mb-6">
          {reward.description}
        </p>
      )}
      
      {/* Dollar Amount Selection Grid */}
      <div className="mb-6">
        <Label className="text-sm font-medium mb-3 block">Select Amount</Label>
        <div className="grid grid-cols-2 gap-3">
          {dollarAmounts.map((amount) => {
            const pointsNeeded = getPointsForAmount(amount);
            const canAfford = pointsNeeded <= userPoints;
            const isSelected = selectedAmount === amount;
            
            return (
              <button
                key={amount}
                onClick={() => setSelectedAmount(amount)}
                disabled={!canAfford || isLoadingPoints}
                className={`relative p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                  isSelected 
                    ? 'border-primary bg-primary/5' 
                    : canAfford 
                      ? 'border-border hover:border-primary/50 hover:bg-muted/50' 
                      : 'border-border bg-muted/30 opacity-50 cursor-not-allowed'
                }`}
              >
                {isSelected && (
                  <Check className="absolute top-2 right-2 h-4 w-4 text-primary" />
                )}
                <div className="font-semibold text-lg">${amount}</div>
                <div className="text-sm text-muted-foreground">
                  {pointsNeeded.toLocaleString()} points
                </div>
                {!canAfford && !isLoadingPoints && (
                  <div className="text-xs text-destructive mt-1">
                    Need {(pointsNeeded - userPoints).toLocaleString()} more
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Email Input */}
      <div className="mb-6">
        <Label htmlFor="recipient-email" className="text-sm font-medium mb-2 block">
          Recipient Email
        </Label>
        <Input
          id="recipient-email"
          type="email"
          value={recipientEmail}
          onChange={(e) => setRecipientEmail(e.target.value)}
          placeholder="Enter recipient email address"
          className="w-full"
        />
        <p className="text-xs text-muted-foreground mt-1">
          The gift link will be sent to this email address
        </p>
      </div>
      
      {/* Insufficient Points Alert for Selected Amount */}
      {selectedAmount && !hasEnoughPointsForSelected && !isLoadingPoints && (
        <Alert className="mb-4 border-destructive/50 bg-destructive/10">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive">
            You need {(selectedAmountPoints - userPoints).toLocaleString()} more points to redeem ${selectedAmount}.
          </AlertDescription>
        </Alert>
      )}
      
      <Button 
        onClick={handleRedeem}
        disabled={isRedeemDisabled}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? "Processing..." : 
         isLoadingPoints ? "Loading..." :
         !selectedAmount ? "Select Amount" :
         !isValidEmail ? "Enter Valid Email" :
         !hasEnoughPointsForSelected ? "Insufficient Points" :
         "Redeem Gift Card"}
      </Button>
      
      {selectedAmount && hasEnoughPointsForSelected && (
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Redeeming this gift card will deduct {selectedAmountPoints.toLocaleString()} points from your balance
        </p>
      )}
    </div>
  );
};
