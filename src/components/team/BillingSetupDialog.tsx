import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { CreditCard, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";

interface BillingSetupDialogProps {
  onSetupComplete: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BillingSetupDialog = ({ onSetupComplete, open, onOpenChange }: BillingSetupDialogProps) => {
  const [isSettingUp, setIsSettingUp] = useState(false);
  const { companyId, user, firstName, lastName } = useAuth();
  const { memberPriceInCents } = usePlatformSettings();
  const pricePerMember = (memberPriceInCents / 100).toFixed(2);

  const handleSetupBilling = async () => {
    if (!companyId || !user) {
      toast.error("Company or user information is missing");
      return;
    }

    setIsSettingUp(true);

    try {
      // Validate session server-side (getSession only checks local cache)
      const { data: { user: validUser }, error: userError } = await supabase.auth.getUser();

      if (userError || !validUser) {
        toast.error("Your session has expired. Please log in again.");
        setIsSettingUp(false);
        return;
      }

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
        if (error.message?.includes('401') || error.message?.includes('Unauthorized') || error.message?.includes('403')) {
          toast.error("Your session has expired. Please log in again.");
          await supabase.auth.signOut();
          return;
        }
        throw error;
      }
      
      if (data?.alreadySubscribed) {
        toast.success("You already have an active subscription!");
        onSetupComplete();
        return;
      }

      if (data?.url) {
        onOpenChange(false);
        window.location.href = data.url;
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Start Your Subscription</DialogTitle>
          <DialogDescription>
            Begin your subscription to start inviting team members.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              How Billing Works
            </h4>
            <div className="space-y-2 text-sm text-blue-700">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                <span>Your subscription starts at <strong>${pricePerMember}/month</strong> for your admin seat</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                <span>Team members are added to your subscription as they join</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                <span>Prorated billing — you only pay for the time used</span>
              </div>
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
                Start Subscription — ${pricePerMember}/mo
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BillingSetupDialog;
