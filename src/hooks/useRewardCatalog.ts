
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Reward {
  id: string;
  name: string;
  description: string;
  points_cost: number;
  image_url: string;
  stock?: number;
  company_id: string | null;
  external_id: string;
  rye_product_url: string;
  is_global: boolean;
}

export const useRewardCatalog = () => {
  // Fetch global rewards only (company admins see what platform admin manages)
  const { data: rewards = [], isLoading: isLoadingRewards } = useQuery({
    queryKey: ['global-rewards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .is('company_id', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching global rewards:', error);
        throw error;
      }

      return data as Reward[];
    }
  });

  return {
    rewards,
    isLoadingRewards
  };
};
