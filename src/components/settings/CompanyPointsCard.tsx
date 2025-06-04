
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, CreditCard, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

interface CompanyPointsCardProps {
  companyPoints: number;
  onPointsUpdated: () => void;
}

export const CompanyPointsCard = ({ companyPoints, onPointsUpdated }: CompanyPointsCardProps) => {
  const [openTopUp, setOpenTopUp] = useState(false);
  const [pointsToAdd, setPointsToAdd] = useState<number>(100);
  const [isLoading, setIsLoading] = useState(false);
  const { user, companyId } = useAuth();

  // Calculate costs for transparency
  const pointsCost = pointsToAdd * 0.01; // $0.01 per point
  const stripeFee = Math.round((pointsCost * 100 * 0.029) + 30) / 100; // 2.9% + $0.30
  const totalCost = pointsCost + stripeFee;

  // Check for payment success on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const sessionId = urlParams.get('session_id');

    if (paymentStatus === 'success' && sessionId) {
      verifyPayment(sessionId);
      // Clean up URL
      window.history.replaceState({}, '', '/dashboard/settings');
    } else if (paymentStatus === 'cancelled') {
      toast.error("Payment was cancelled");
      // Clean up URL
      window.history.replaceState({}, '', '/dashboard/settings');
    }
  }, []);

  const verifyPayment = async (sessionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-points-payment', {
        body: { session_id: sessionId }
      });

      if (error) throw error;

      toast.success(`Payment successful! ${data.points_added} points added to your company balance.`);
      onPointsUpdated();
    } catch (error) {
      console.error("Payment verification error:", error);
      toast.error("Payment verification failed. Please contact support if points were not added.");
    }
  };

  const handleStripePayment = async () => {
    if (!pointsToAdd || pointsToAdd <= 0 || !companyId || !user?.id) {
      toast.error("Please enter a valid amount");
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-points-payment', {
        body: { pointsToAdd }
      });

      if (error) throw error;

      // Redirect to Stripe checkout
      window.location.href = data.url;
    } catch (error) {
      console.error("Error creating payment:", error);
      toast.error("Failed to create payment session");
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card className="dashboard-card">
        <div className="card-header">
          <h2 className="card-title">Company Points Balance</h2>
        </div>
        
        <div className="mt-6 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50 rounded-md">
          <div>
            <p className="text-gray-500 text-sm font-medium">Current Balance</p>
            <p className="text-2xl font-bold text-[#F572FF]">{companyPoints} points</p>
            <p className="text-sm text-gray-500 mt-1">
              Points are used to recognize team members' contributions
            </p>
          </div>
          
          <Button 
            onClick={() => setOpenTopUp(true)}
            className="bg-[#F572FF] hover:bg-[#E061EE]"
          >
            <Plus className="mr-2 h-4 w-4" /> Top Up Points
          </Button>
        </div>
      </Card>

      {/* Stripe Payment Dialog */}
      <Dialog open={openTopUp} onOpenChange={setOpenTopUp}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Company Points with Stripe</DialogTitle>
            <DialogDescription>
              Securely add points to your company balance using Stripe payment processing.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="points">Points to Add</Label>
              <Input
                id="points"
                type="number" 
                min={1}
                value={pointsToAdd}
                onChange={(e) => setPointsToAdd(parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="bg-gray-50 p-4 rounded-md space-y-2">
              <h4 className="font-medium text-sm text-gray-700">Cost Breakdown</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>{pointsToAdd} points</span>
                  <span>${pointsCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Processing fee (Stripe)</span>
                  <span>${stripeFee.toFixed(2)}</span>
                </div>
                <div className="border-t pt-1 flex justify-between font-medium">
                  <span>Total</span>
                  <span>${totalCost.toFixed(2)}</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                <CheckCircle className="inline w-3 h-3 mr-1" />
                Secure payment processing by Stripe
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenTopUp(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleStripePayment} 
              disabled={isLoading || pointsToAdd <= 0}
              className="bg-[#F572FF] hover:bg-[#E061EE]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pay with Stripe
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
