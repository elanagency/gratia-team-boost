import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  birthday: string | null;
  company_start_date: string | null;
}

interface RewardedRow { profile_id: string; reward_type: string; }

export interface UpcomingCelebrationsData {
  upcomingBirthdays: number;
  upcomingAnniversaries: number;
  isLoading: boolean;
}

/**
 * Counts birthdays and anniversaries that fall in the current calendar month
 * (i.e. before/on the next monthly billing cycle) AND haven't already been
 * rewarded this year. Mirrors logic in CelebrationSettingsCard.
 */
export function useUpcomingCelebrations(companyId: string | null | undefined): UpcomingCelebrationsData {
  const { data: profiles, isLoading: loadingProfiles } = useQuery({
    queryKey: ["upcoming-celebrations-profiles", companyId],
    queryFn: async (): Promise<Profile[]> => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, birthday, company_start_date")
        .eq("company_id", companyId)
        .eq("status", "active");
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const { data: rewarded, isLoading: loadingRewarded } = useQuery({
    queryKey: ["upcoming-celebrations-rewarded", companyId],
    queryFn: async (): Promise<RewardedRow[]> => {
      if (!companyId) return [];
      const currentYear = new Date().getFullYear();
      const { data, error } = await supabase
        .from("celebration_rewards_log")
        .select("profile_id, reward_type")
        .eq("company_id", companyId)
        .eq("year", currentYear);
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  const now = new Date();
  const currentMonth = now.getMonth();
  const rewardedSet = new Set((rewarded || []).map((r) => `${r.profile_id}_${r.reward_type}`));

  let upcomingBirthdays = 0;
  let upcomingAnniversaries = 0;

  (profiles || []).forEach((p) => {
    if (p.birthday) {
      const bd = new Date(p.birthday + "T00:00:00");
      if (bd.getMonth() === currentMonth && !rewardedSet.has(`${p.id}_birthday`)) {
        upcomingBirthdays += 1;
      }
    }
    if (p.company_start_date) {
      const sd = new Date(p.company_start_date + "T00:00:00");
      if (sd.getMonth() === currentMonth && !rewardedSet.has(`${p.id}_anniversary`)) {
        upcomingAnniversaries += 1;
      }
    }
  });

  return {
    upcomingBirthdays,
    upcomingAnniversaries,
    isLoading: loadingProfiles || loadingRewarded,
  };
}
