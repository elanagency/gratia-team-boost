import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOnboardingProgress } from "@/hooks/useOnboardingProgress";
import { useAuth } from "@/context/AuthContext";

const OnboardingProgressWidget: React.FC = () => {
  const { companyId } = useAuth();
  const { completedCount, totalSteps, isFullyComplete, isLoading } = useOnboardingProgress();
  const navigate = useNavigate();

  const storageKey = `onboarding_dismissed_${companyId}`;
  const [dismissed] = useState(() => {
    if (!companyId) return false;
    return localStorage.getItem(storageKey) === "true";
  });

  if (dismissed || isFullyComplete || isLoading || !companyId) return null;

  const progressPercent = (completedCount / totalSteps) * 100;

  return (
    <button
      onClick={() => navigate("/dashboard")}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 transition-colors"
    >
      {/* Mini progress ring */}
      <svg width="18" height="18" viewBox="0 0 18 18" className="shrink-0">
        <circle cx="9" cy="9" r="7" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2.5" />
        <circle
          cx="9" cy="9" r="7"
          fill="none"
          stroke="#F572FF"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={`${2 * Math.PI * 7}`}
          strokeDashoffset={`${2 * Math.PI * 7 * (1 - progressPercent / 100)}`}
          transform="rotate(-90 9 9)"
        />
      </svg>
      <span className="text-xs font-medium text-white whitespace-nowrap">
        {completedCount}/{totalSteps} Setup
      </span>
    </button>
  );
};

export default OnboardingProgressWidget;
