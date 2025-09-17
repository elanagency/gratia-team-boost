
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
      if (!user?.id) return [];
      
      // Return empty array until redemption system is implemented
      return [];
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
