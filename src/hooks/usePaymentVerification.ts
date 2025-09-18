import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const usePaymentVerification = (onSuccess?: () => void) => {
  const [searchParams] = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(false);
  const processedSessionIds = useRef(new Set<string>());

  useEffect(() => {
    const setupStatus = searchParams.get('setup');
    const sessionId = searchParams.get('session_id');
    
    if (setupStatus === 'success' && sessionId) {
      if (processedSessionIds.current.has(sessionId) || isVerifying) {
        return;
      }

      console.log("Processing successful payment with session ID:", sessionId);
      setIsVerifying(true);
      
      processedSessionIds.current.add(sessionId);
      
      supabase.functions.invoke('verify-stripe-session', {
        body: { sessionId }
      }).then(({ data, error }) => {
        if (error) {
          console.error("Error verifying payment:", error);
          toast.error("Failed to process subscription setup. Please contact support.");
        } else {
          console.log("Payment verification successful:", data);
          toast.success("Subscription setup successful! You can now add team members.");
          onSuccess?.();
        }
      }).catch((err) => {
        console.error("Verification request failed:", err);
        toast.error("Failed to verify payment. Please contact support.");
      }).finally(() => {
        setIsVerifying(false);
        window.history.replaceState({}, '', '/dashboard/settings');
      });
    } else if (setupStatus === 'cancelled') {
      toast.error("Subscription setup was cancelled.");
      window.history.replaceState({}, '', '/dashboard/settings');
    }
  }, [searchParams, onSuccess, isVerifying]);

  return { isVerifying };
};