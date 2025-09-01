
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export interface Redemption {
  id: string;
  user_id: string;
  reward_id: string;
  points_spent: number;
  status: string;
  shipping_address: any;
  external_cart_id: string | null;
  external_order_id: string | null;
  redemption_date: string;
  updated_at: string;
  reward?: {
    name: string;
    image_url: string | null;
  }
}

export const useRedemptions = () => {
  const { user } = useAuth();

  const {
    data: redemptions = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['redemptions', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('reward_redemptions')
        .select(`
          *,
          reward:reward_id (
            name,
            image_url
          )
        `)
        .eq('user_id', user.id)
        .order('redemption_date', { ascending: false });

      if (error) {
        console.error('Error fetching redemptions:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!user
  });

  return {
    redemptions,
    isLoading,
    error,
    refetch
  };
};
