
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export const useMonthlySpending = () => {
  const { user, companyId } = useAuth();

  const { data: spendingData, isLoading, error } = useQuery({
    queryKey: ['monthlySpending', user?.id, companyId],
    queryFn: async () => {
      if (!user?.id || !companyId) return { spent: 0, limit: 0, remaining: 0 };

      // Get current month spending for the user
      const { data: spentData, error: spentError } = await supabase
        .rpc('get_user_monthly_spending', {
          user_id: user.id,
          company_id: companyId
        });

      if (spentError) {
        console.error('Error fetching monthly spending:', spentError);
        throw spentError;
      }

      // Get company monthly limit
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('team_member_monthly_limit')
        .eq('id', companyId)
        .single();

      if (companyError) {
        console.error('Error fetching company limit:', companyError);
        throw companyError;
      }

      const spent = spentData || 0;
      const limit = companyData?.team_member_monthly_limit || 0;
      const remaining = Math.max(0, limit - spent);

      return { spent, limit, remaining };
    },
    enabled: !!user?.id && !!companyId
  });

  return {
    monthlySpent: spendingData?.spent || 0,
    monthlyLimit: spendingData?.limit || 0,
    monthlyRemaining: spendingData?.remaining || 0,
    isLoading,
    error
  };
};
