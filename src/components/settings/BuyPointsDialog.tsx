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

const QUICK_OPTIONS = [500, 1000, 2500, 5000];

const BuyPointsDialog = ({ open, onOpenChange, companyId, exchangeRate }: BuyPointsDialogProps) => {
  const [quantity, setQuantity] = useState("500");
  const [loading, setLoading] = useState(false);

  const points = Math.max(parseInt(quantity) || 0, 0);
  const totalCost = points * exchangeRate;

  const handleProceed = async () => {
    if (points < 100) {
      toast.error("Minimum purchase is 100 points");
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
                  variant={parseInt(quantity) === opt ? "default" : "outline"}
                  size="sm"
                  onClick={() => setQuantity(String(opt))}
                  className="hover:bg-muted"
                >
                  {opt.toLocaleString()} pts
                </Button>
              ))}
            </div>
          </div>

          {/* Custom input */}
          <div className="space-y-2">
            <Label htmlFor="points-qty">Points quantity</Label>
            <Input
              id="points-qty"
              type="number"
              min="100"
              step="100"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
            {points > 0 && points < 100 && (
              <p className="text-xs text-destructive">Minimum 100 points</p>
            )}
          </div>

          {/* Cost display */}
          {points >= 100 && (
            <div className="rounded-lg bg-muted p-4 space-y-1">
              <div className="flex justify-between text-sm">
                <span>{points.toLocaleString()} points</span>
                <span>× ${exchangeRate.toFixed(2)}</span>
              </div>
              <div className="border-t border-border pt-1 flex justify-between font-semibold">
                <span>Total</span>
                <span>${totalCost.toFixed(2)} USD</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="hover:bg-muted">
            Cancel
          </Button>
          <Button onClick={handleProceed} disabled={loading || points < 100}>
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
