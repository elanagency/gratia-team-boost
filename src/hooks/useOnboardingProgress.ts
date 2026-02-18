import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export interface OnboardingStep {
  key: string;
  label: string;
  description: string;
  completed: boolean;
  optional?: boolean;
}

interface OnboardingProgress {
  steps: OnboardingStep[];
  completedCount: number;
  totalSteps: number;
  isFullyComplete: boolean;
  isLoading: boolean;
}

export const useOnboardingProgress = (): OnboardingProgress => {
  const { companyId } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["onboarding-progress", companyId],
    queryFn: async () => {
      if (!companyId) return null;

      const [companyRes, membersRes, slackRes, teamsRes] = await Promise.all([
        supabase
          .from("companies")
          .select("stripe_subscription_id, birthday_reward_points, anniversary_reward_points, birthday_rewards_enabled, anniversary_rewards_enabled")
          .eq("id", companyId)
          .single(),
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("company_id", companyId),
        supabase
          .from("slack_integrations")
          .select("id", { count: "exact", head: true })
          .eq("company_id", companyId),
        supabase
          .from("teams_integrations")
          .select("id", { count: "exact", head: true })
          .eq("company_id", companyId),
      ]);

      const company = companyRes.data;
      const memberCount = membersRes.count ?? 0;
      const slackCount = slackRes.count ?? 0;
      const teamsCount = teamsRes.count ?? 0;

      const hasSubscription = !!company?.stripe_subscription_id;
      const hasMembers = memberCount > 1;
      const hasIntegration = slackCount > 0 || teamsCount > 0;
      const hasCelebrations =
        (company?.birthday_rewards_enabled && (company?.birthday_reward_points ?? 0) > 0) ||
        (company?.anniversary_rewards_enabled && (company?.anniversary_reward_points ?? 0) > 0);

      return { hasSubscription, hasMembers, hasIntegration, hasCelebrations };
    },
    enabled: !!companyId,
    staleTime: 30_000,
  });

  const steps: OnboardingStep[] = [
    {
      key: "upgrade",
      label: "Upgrade to Add Your Team",
      description: "Start your subscription",
      completed: data?.hasSubscription ?? false,
    },
    {
      key: "members",
      label: "Add Team Members",
      description: "Invite your first team member",
      completed: data?.hasMembers ?? false,
    },
    {
      key: "integrations",
      label: "Connect Slack or Teams",
      description: "Set up notifications",
      completed: data?.hasIntegration ?? false,
    },
    {
      key: "celebrations",
      label: "Allocate Birthday & Anniversary Points",
      description: "Reward your team on special days",
      completed: data?.hasCelebrations ?? false,
      optional: true,
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;

  return {
    steps,
    completedCount,
    totalSteps: steps.length,
    isFullyComplete: completedCount === steps.length,
    isLoading,
  };
};
