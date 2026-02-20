import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";

const SubscriptionSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [errorMessage, setErrorMessage] = useState("");
  const hasRun = useRef(false);

  useEffect(() => {
    if (!sessionId || hasRun.current) return;
    hasRun.current = true;

    supabase.functions
      .invoke("verify-stripe-session", { body: { sessionId } })
      .then(({ data, error }) => {
        if (error) {
          console.error("Verification error:", error);
          setErrorMessage("Failed to verify subscription. Please contact support.");
          setStatus("error");
        } else {
          console.log("Subscription verified:", data);
          setStatus("success");

          window.dispatchEvent(new CustomEvent("billing-updated"));
          queryClient.invalidateQueries({ queryKey: ["company-members"] });
          queryClient.invalidateQueries({ queryKey: ["teamMembers"] });
          queryClient.invalidateQueries({ queryKey: ["user-profile"] });
          queryClient.invalidateQueries({ queryKey: ["onboarding-progress"] });

          setTimeout(() => {
            navigate("/dashboard/settings?tab=billing", { replace: true });
          }, 2000);
        }
      })
      .catch((err) => {
        console.error("Verification request failed:", err);
        setErrorMessage("Failed to verify payment. Please contact support.");
        setStatus("error");
      });
  }, [sessionId, navigate, queryClient]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center space-y-4">
          {status === "verifying" && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              <h2 className="text-xl font-semibold">Setting up your subscription...</h2>
              <p className="text-muted-foreground">Please wait while we confirm your payment.</p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
              <h2 className="text-xl font-semibold">Subscription activated!</h2>
              <p className="text-muted-foreground">Redirecting you to your dashboard...</p>
            </>
          )}

          {status === "error" && (
            <>
              <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
              <h2 className="text-xl font-semibold">Something went wrong</h2>
              <p className="text-muted-foreground">{errorMessage}</p>
              <Button onClick={() => navigate("/dashboard/settings?tab=billing", { replace: true })}>
                Go to Settings
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionSuccess;
