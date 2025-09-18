import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { CreditCard, Shield, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePricing } from "@/hooks/usePricing";

interface BillingSetupDialogProps {
  onSetupComplete: () => void;
}

const BillingSetupDialog = ({ onSetupComplete }: BillingSetupDialogProps) => {
  const [open, setOpen] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const { companyId, user, firstName, lastName } = useAuth();
  const { pricePerMember } = usePricing();

  const handleSetupBilling = async () => {
    if (!companyId || !user) {
      toast.error("Company or user information is missing");
      return;
    }

    setIsSettingUp(true);

    try {
      console.log("Setting up billing for company:", companyId);
      
      const origin = window.location.origin;
      
      const { data, error } = await supabase.functions.invoke('billing-setup-checkout', {
        body: { 
          companyId,
          memberData: {
            name: firstName && lastName ? `${firstName} ${lastName}`.trim() : 'Admin',
            email: user?.email
          },
          origin
        }
      });
      
      if (error) {
        console.error("Error from billing-setup-checkout:", error);
        throw error;
      }
      
      console.log("Billing setup response:", data);
      
      if (data.checkoutUrl) {
        console.log("Redirecting to billing setup:", data.checkoutUrl);
        
        // Close dialog before redirect
        setOpen(false);
        
        // Redirect to Stripe setup
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error("No checkout URL received");
      }
      
    } catch (error) {
      console.error("Error setting up billing:", error);
      toast.error("Failed to setup billing. Please try again.");
    } finally {
      setIsSettingUp(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button 
          variant="default" 
          className="bg-[#F572FF] hover:bg-[#E061EE] text-white"
        >
          <CreditCard className="mr-2 h-4 w-4" />
          Setup Billing
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Setup Your Billing</DialogTitle>
          <DialogDescription>
            Set up your payment method to start inviting team members. No charges until your first team member logs in.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Secure Payment Setup
            </h4>
            <div className="space-y-2 text-sm text-blue-700">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                <span>Add your payment method securely with Stripe</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                <span>No charges today - just setup</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                <span>Billing starts when first team member logs in</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Billing Details
            </h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Cost:</strong> ${pricePerMember}/month per active team member</p>
              <p><strong>Billing:</strong> Monthly, based on active members</p>
              <p><strong>Start Date:</strong> When first team member logs in</p>
            </div>
          </div>

          <Button 
            onClick={handleSetupBilling}
            disabled={isSettingUp}
            className="w-full bg-[#F572FF] hover:bg-[#E061EE] text-white"
            size="lg"
          >
            {isSettingUp ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Setting up...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Setup Payment Method
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BillingSetupDialog;