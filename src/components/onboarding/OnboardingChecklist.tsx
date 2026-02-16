import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, CheckCircle2, CreditCard, Users, MessageSquare, Gift } from "lucide-react";
import { useOnboardingProgress, type OnboardingStep } from "@/hooks/useOnboardingProgress";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface OnboardingChecklistProps {
  onUpgradeClick: () => void;
}

const stepIcons: Record<string, React.ElementType> = {
  upgrade: CreditCard,
  members: Users,
  integrations: MessageSquare,
  celebrations: Gift,
};

const stepRoutes: Record<string, string> = {
  members: "/dashboard/team",
  integrations: "/dashboard/settings?tab=notifications",
  celebrations: "/dashboard/settings?tab=celebrations",
};

const OnboardingChecklist: React.FC<OnboardingChecklistProps> = ({ onUpgradeClick }) => {
  const { companyId } = useAuth();
  const { steps, completedCount, totalSteps, isFullyComplete, isLoading } = useOnboardingProgress();
  const navigate = useNavigate();

  const storageKey = `onboarding_dismissed_${companyId}`;
  const [dismissed, setDismissed] = useState(() => {
    if (!companyId) return false;
    return localStorage.getItem(storageKey) === "true";
  });

  useEffect(() => {
    if (isFullyComplete && !dismissed) {
      toast.success("🎉 Onboarding complete! You're all set.");
      setDismissed(true);
      if (companyId) localStorage.setItem(storageKey, "true");
    }
  }, [isFullyComplete, dismissed, companyId, storageKey]);

  if (dismissed || isLoading || !companyId) return null;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(storageKey, "true");
  };

  const handleStepClick = (step: OnboardingStep) => {
    if (step.completed) return;
    if (step.key === "upgrade") {
      onUpgradeClick();
    } else {
      const route = stepRoutes[step.key];
      if (route) navigate(route);
    }
  };

  const progressPercent = (completedCount / totalSteps) * 100;

  return (
    <Card className="border bg-card">
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-foreground">Get Started</h3>
            <p className="text-sm text-muted-foreground">
              {completedCount} of {totalSteps} steps completed
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:bg-muted"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress bar */}
        <Progress value={progressPercent} className="h-2 mb-5 [&>div]:bg-[#F572FF]" />

        {/* Step cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {steps.map((step, idx) => {
            const Icon = stepIcons[step.key];
            const isNext = !step.completed && steps.slice(0, idx).every((s) => s.completed);

            return (
              <button
                key={step.key}
                onClick={() => handleStepClick(step)}
                disabled={step.completed}
                className={`
                  relative flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-colors
                  ${step.completed
                    ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950 cursor-default"
                    : isNext
                      ? "border-[#F572FF]/40 bg-[#F572FF]/5 hover:bg-[#F572FF]/10 cursor-pointer"
                      : "border-border bg-card hover:bg-muted/50 cursor-pointer"
                  }
                `}
              >
                {/* Step number / check */}
                <div className="flex w-full items-center justify-between">
                  {step.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold
                        ${isNext ? "bg-[#F572FF] text-white" : "border border-muted-foreground/30 text-muted-foreground"}
                      `}
                    >
                      {idx + 1}
                    </span>
                  )}
                  {step.optional && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      Optional
                    </Badge>
                  )}
                </div>

                {/* Icon + text */}
                <div className="flex items-center gap-2 mt-1">
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium text-foreground leading-tight">{step.label}</span>
                </div>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default OnboardingChecklist;
