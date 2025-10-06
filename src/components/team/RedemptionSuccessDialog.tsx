import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, Gift, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface RedemptionSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brandName: string;
  dollarAmount: number;
  pointsSpent: number;
  giftLink?: string;
}

export const RedemptionSuccessDialog = ({
  open,
  onOpenChange,
  brandName,
  dollarAmount,
  pointsSpent,
  giftLink,
}: RedemptionSuccessDialogProps) => {
  const navigate = useNavigate();

  const handleViewRedemptions = () => {
    onOpenChange(false);
    navigate("/dashboard/profile");
  };

  const handleContinueShopping = () => {
    onOpenChange(false);
  };

  const handleViewGiftCard = () => {
    if (giftLink) {
      window.open(giftLink, "_blank");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          
          <DialogTitle className="text-2xl font-bold">
            🎉 Congratulations!
          </DialogTitle>
          
          <DialogDescription className="text-base space-y-2">
            <p className="font-semibold text-foreground">
              You've redeemed ${dollarAmount} {brandName}!
            </p>
            <p className="text-sm text-muted-foreground">
              {pointsSpent} points well spent
            </p>
            <p className="text-sm text-muted-foreground">
              {giftLink 
                ? "Your gift card is ready to use!" 
                : "Your gift card will be ready shortly and sent to your email."}
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-4">
          {giftLink && (
            <Button
              onClick={handleViewGiftCard}
              className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
            >
              <Gift className="w-4 h-4 mr-2" />
              View Gift Card
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          )}
          
          <Button
            onClick={handleViewRedemptions}
            variant="outline"
            className="w-full"
          >
            View My Redemptions
          </Button>
          
          <Button
            onClick={handleContinueShopping}
            variant="ghost"
            className="w-full hover:bg-muted"
          >
            Continue Shopping
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
