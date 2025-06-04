
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

interface SetupBillingButtonProps {
  employeeCount: number;
  onSuccess?: () => void;
}

export const SetupBillingButton = ({ employeeCount, onSuccess }: SetupBillingButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { companyId } = useAuth();

  const handleSetupBilling = async () => {
    if (!companyId) {
      toast.error("Company ID not found");
      return;
    }

    setIsLoading(true);
    
    try {
      console.log("Creating subscription checkout for:", { companyId, employeeCount });
      
      const { data, error } = await supabase.functions.invoke('create-subscription-checkout', {
        body: { 
          companyId,
          employeeCount
        }
      });
      
      if (error) throw error;
      
      console.log("Checkout session created:", data);
      
      // Redirect to Stripe checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error) {
      console.error("Error creating subscription checkout:", error);
      toast.error("Failed to setup billing. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleSetupBilling}
      disabled={isLoading}
      className="bg-[#F572FF] hover:bg-[#E061EE] text-white"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Setting up...
        </>
      ) : (
        <>
          <CreditCard className="mr-2 h-4 w-4" />
          Setup Billing for {employeeCount} Member{employeeCount > 1 ? 's' : ''}
        </>
      )}
    </Button>
  );
};
