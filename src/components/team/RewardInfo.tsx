
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Check } from "lucide-react";
import { GiftCard } from "@/hooks/useRewardsShop";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RewardInfoProps {
  reward: GiftCard;
  onRedeem: (amount: number, email: string, firstName: string, lastName: string) => void;
  isProcessing: boolean;
  userPoints: number;
  isLoadingPoints: boolean;
  exchangeRate: string;
  currentUserFirstName?: string;
  currentUserLastName?: string;
}

export const RewardInfo = ({
  reward,
  onRedeem,
  isProcessing,
  userPoints,
  isLoadingPoints,
  exchangeRate,
  currentUserFirstName = "",
  currentUserLastName = ""
}: RewardInfoProps) => {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientFirstName, setRecipientFirstName] = useState(currentUserFirstName);
  const [recipientLastName, setRecipientLastName] = useState(currentUserLastName);
  
  const dollarAmounts = [15, 20, 25, 30];
  const rate = parseFloat(exchangeRate);
  
  // Calculate points for each dollar amount
  const getPointsForAmount = (dollarAmount: number) => {
    return Math.ceil(dollarAmount / rate);
  };
  
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail);
  const isValidFirstName = recipientFirstName.trim().length > 0;
  const isValidLastName = recipientLastName.trim().length > 0;
  const selectedAmountPoints = selectedAmount ? getPointsForAmount(selectedAmount) : 0;
  const hasEnoughPointsForSelected = selectedAmountPoints <= userPoints;
  
  const isRedeemDisabled = !selectedAmount || !isValidEmail || !isValidFirstName || !isValidLastName || isLoadingPoints || !hasEnoughPointsForSelected || isProcessing;
  
  const handleRedeem = () => {
    if (selectedAmount && isValidEmail && isValidFirstName && isValidLastName && hasEnoughPointsForSelected) {
      onRedeem(selectedAmount, recipientEmail, recipientFirstName.trim(), recipientLastName.trim());
    }
  };
  // Show error state if settings failed to load or are missing
  if (!exchangeRate) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold">{reward.name}</h2>
        </div>
        <Alert className="border-destructive/50 bg-destructive/10">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive">
            A problem occurred, try again later
          </AlertDescription>
        </Alert>
      </div>
    );
  }

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
      
      {/* Amount Selection */}
      <div className="mb-6">
        <Label className="text-sm font-medium mb-3 block">
          {reward.price_is_variable ? "Select Amount" : "Price"}
        </Label>
        
        {reward.price_is_variable ? (
          // Variable pricing: Show 4 dollar amount options
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
        ) : (
          // Fixed pricing: Show single price option
          <div className="max-w-sm">
            <button
              onClick={() => setSelectedAmount(reward.price / 100)} // Convert cents to dollars
              disabled={!userPoints || reward.points_cost > userPoints || isLoadingPoints}
              className={`relative w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                selectedAmount === (reward.price / 100)
                  ? 'border-primary bg-primary/5' 
                  : reward.points_cost <= userPoints
                    ? 'border-border hover:border-primary/50 hover:bg-muted/50' 
                    : 'border-border bg-muted/30 opacity-50 cursor-not-allowed'
              }`}
            >
              {selectedAmount === (reward.price / 100) && (
                <Check className="absolute top-2 right-2 h-4 w-4 text-primary" />
              )}
              <div className="font-semibold text-lg">${(reward.price / 100).toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">
                {reward.points_cost.toLocaleString()} points
              </div>
              {reward.points_cost > userPoints && !isLoadingPoints && (
                <div className="text-xs text-destructive mt-1">
                  Need {(reward.points_cost - userPoints).toLocaleString()} more points
                </div>
              )}
            </button>
          </div>
        )}
      </div>
      
      {/* Recipient Information */}
      <div className="mb-6 space-y-4">
        <Label className="text-sm font-medium block">Recipient Information</Label>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="recipient-first-name" className="text-sm font-medium mb-1 block">
              First Name
            </Label>
            <Input
              id="recipient-first-name"
              type="text"
              value={recipientFirstName}
              onChange={(e) => setRecipientFirstName(e.target.value)}
              placeholder="First name"
              className="w-full"
            />
          </div>
          
          <div>
            <Label htmlFor="recipient-last-name" className="text-sm font-medium mb-1 block">
              Last Name
            </Label>
            <Input
              id="recipient-last-name"
              type="text"
              value={recipientLastName}
              onChange={(e) => setRecipientLastName(e.target.value)}
              placeholder="Last name"
              className="w-full"
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="recipient-email" className="text-sm font-medium mb-1 block">
            Email Address
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
         !isValidFirstName || !isValidLastName ? "Enter Recipient Name" :
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
