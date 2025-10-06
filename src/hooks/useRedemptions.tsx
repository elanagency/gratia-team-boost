
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";

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
  const queryClient = useQueryClient();

  const {
    data: redemptions = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['redemptions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('redemptions')
        .select(`
          id,
          user_id,
          reward_id,
          reward_name,
          points_spent,
          status,
          shipping_address,
          individual_gift_link,
          redemption_date,
          updated_at
        `)
        .eq('user_id', user.id)
        .order('redemption_date', { ascending: false });

      if (error) {
        console.error('Error fetching redemptions:', error);
        throw error;
      }

      return data.map(redemption => ({
        id: redemption.id,
        user_id: redemption.user_id,
        reward_id: redemption.reward_id,
        points_spent: redemption.points_spent,
        status: redemption.status,
        shipping_address: redemption.shipping_address,
        external_cart_id: null,
        external_order_id: redemption.individual_gift_link,
        redemption_date: redemption.redemption_date,
        updated_at: redemption.updated_at,
        reward: {
          name: redemption.reward_name,
          image_url: null
        }
      }));
    },
    enabled: !!user
  });

  // Subscribe to real-time updates for redemptions
  useEffect(() => {
    if (!user?.id) return;

    console.log('Setting up real-time subscription for redemptions');
    
    const channel = supabase
      .channel('redemptions-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'redemptions',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Redemption updated via webhook:', payload);
          // Invalidate query to refetch redemptions
          queryClient.invalidateQueries({ queryKey: ['redemptions', user.id] });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return {
    redemptions,
    isLoading,
    error,
    refetch
  };
};
