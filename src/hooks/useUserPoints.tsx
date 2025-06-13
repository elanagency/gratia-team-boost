
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export const useUserPoints = () => {
  const { user, companyId } = useAuth();

  const { data: userPoints = 0, isLoading, error } = useQuery({
    queryKey: ['userPoints', user?.id, companyId],
    queryFn: async () => {
      if (!user?.id || !companyId) return 0;

      const { data, error } = await supabase
        .from('company_members')
        .select('points')
        .eq('user_id', user.id)
        .eq('company_id', companyId)
        .single();

      if (error) {
        console.error('Error fetching user points:', error);
        throw error;
      }

      return data?.points || 0;
    },
    enabled: !!user?.id && !!companyId
  });

  return {
    userPoints,
    isLoading,
    error
  };
};
