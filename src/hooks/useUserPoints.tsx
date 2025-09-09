
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export const useUserPoints = () => {
  const { user, companyId } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['userPoints', user?.id, companyId],
    queryFn: async () => {
      if (!user?.id || !companyId) return { recognitionPoints: 0, monthlyPoints: 0 };

      const { data, error } = await supabase
        .from('company_members')
        .select('points, monthly_points')
        .eq('user_id', user.id)
        .eq('company_id', companyId)
        .single();

      if (error) {
        console.error('Error fetching user points:', error);
        throw error;
      }

      return {
        recognitionPoints: data?.points || 0,
        monthlyPoints: data?.monthly_points || 0
      };
    },
    enabled: !!user?.id && !!companyId
  });

  return {
    recognitionPoints: data?.recognitionPoints || 0,
    monthlyPoints: data?.monthlyPoints || 0,
    totalPoints: (data?.recognitionPoints || 0) + (data?.monthlyPoints || 0),
    isLoading,
    error
  };
};
