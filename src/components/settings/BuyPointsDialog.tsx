import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShoppingCart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BuyPointsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  exchangeRate: number;
}

const QUICK_OPTIONS = [25, 50, 100, 250]; // Dollar amounts

const BuyPointsDialog = ({ open, onOpenChange, companyId, exchangeRate }: BuyPointsDialogProps) => {
  const [dollars, setDollars] = useState("25");
  const [loading, setLoading] = useState(false);

  const dollarAmount = Math.max(parseFloat(dollars) || 0, 0);
  const points = Math.round(dollarAmount / exchangeRate);
  const minDollars = 5;

  const handleProceed = async () => {
    if (dollarAmount < minDollars) {
      toast.error(`Minimum purchase is $${minDollars}`);
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be logged in");
        return;
      }

      const response = await supabase.functions.invoke("purchase-company-points", {
        body: {
          companyId,
          pointsQuantity: points,
          origin: window.location.origin,
        },
      });

      if (response.error) throw new Error(response.error.message);

      const { url } = response.data;
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      console.error("Purchase error:", err);
      toast.error(err.message || "Failed to start checkout");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Buy Celebration Points
          </DialogTitle>
          <DialogDescription>
            Purchase points to fund birthday and anniversary rewards for your team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Quick select */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Quick select</Label>
            <div className="flex gap-2 flex-wrap">
              {QUICK_OPTIONS.map((opt) => (
                <Button
                  key={opt}
                  variant={parseFloat(dollars) === opt ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDollars(String(opt))}
                  className="hover:bg-muted"
                >
                  ${opt}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom input */}
          <div className="space-y-2">
            <Label htmlFor="dollar-amount">Dollar amount</Label>
            <div className="relative w-40">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
              <Input
                id="dollar-amount"
                type="number"
                min={minDollars}
                step="1"
                className="pl-7 w-full"
                value={dollars}
                onChange={(e) => setDollars(e.target.value)}
              />
            </div>
            {dollarAmount > 0 && dollarAmount < minDollars && (
              <p className="text-xs text-destructive">Minimum ${minDollars}</p>
            )}
            {dollarAmount >= minDollars && (
              <p className="text-xs text-muted-foreground">= {points.toLocaleString()} points</p>
            )}
          </div>

          {/* Cost display */}
          {dollarAmount >= minDollars && (
            <div className="rounded-lg bg-muted p-4 space-y-1">
              <div className="flex justify-between text-sm">
                <span>{points.toLocaleString()} points</span>
                <span>@ ${exchangeRate.toFixed(2)}/pt</span>
              </div>
              <div className="border-t border-border pt-1 flex justify-between font-semibold">
                <span>Total</span>
                <span>${dollarAmount.toFixed(2)} USD</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="hover:bg-muted">
            Cancel
          </Button>
          <Button onClick={handleProceed} disabled={loading || dollarAmount < minDollars}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Redirecting...
              </>
            ) : (
              "Proceed to Checkout"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BuyPointsDialog;
