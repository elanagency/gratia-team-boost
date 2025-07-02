
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export interface Reward {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  points_cost: number;
  stock: number | null;
  company_id: string | null;
  external_id: string | null;
  rye_product_url: string | null;
  created_at: string;
  is_global?: boolean;
}

export interface RewardCategory {
  id: string;
  name: string;
  company_id: string;
}

export const useRewards = (categoryId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch global rewards (available to all users)
  const { data: rewards = [], isLoading, error } = useQuery({
    queryKey: ['rewards', categoryId],
    queryFn: async () => {
      if (categoryId) {
        // If categoryId is provided, join with category mappings
        // Note: Categories would need to be adapted for global rewards
        const { data, error } = await supabase
          .from('reward_category_mappings')
          .select('reward:reward_id(*)')
          .eq('category_id', categoryId);

        if (error) {
          console.error('Error fetching rewards by category:', error);
          throw error;
        }

        return data ? data.map((item: any) => item.reward).filter((reward: any) => reward.company_id === null) : [];
      } else {
        // Fetch all global rewards (where company_id is NULL)
        const { data, error } = await supabase
          .from('rewards')
          .select('*')
          .is('company_id', null)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching global rewards:', error);
          throw error;
        }

        return data || [];
      }
    }
  });

  // Fetch reward categories (might need adjustment for global system)
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['rewardCategories'],
    queryFn: async () => {
      // For now, return empty array as categories might need restructuring for global rewards
      return [];
    }
  });

  // Redeem a reward using the cart service
  const redeemReward = useMutation({
    mutationFn: async ({ rewardId, shippingAddress }: { rewardId: string, shippingAddress: any }) => {
      if (!user?.id || !rewardId) {
        throw new Error('Missing user ID or reward ID');
      }

      console.log('🎯 useRewards: Starting redemption process for reward:', rewardId);
      console.log('👤 User ID:', user.id);
      console.log('📦 Shipping Address:', JSON.stringify(shippingAddress, null, 2));

      const { data, error } = await supabase.functions.invoke('rye-cart-service', {
        body: {
          action: 'redeem',
          rewardId: rewardId,
          userId: user.id,
          shippingAddress: shippingAddress
        }
      });

      if (error) {
        console.error('❌ Edge function error:', error);
        throw new Error(error.message || 'Failed to process redemption');
      }

      if (!data || !data.success) {
        console.error('❌ Redemption failed:', data);
        throw new Error(data?.error || 'Redemption failed');
      }

      console.log('✅ Redemption successful:', data);
      return data.redemption;
    },
    onSuccess: (data) => {
      console.log('🎉 Redemption mutation succeeded:', data);
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
      queryClient.invalidateQueries({ queryKey: ['redemptions'] });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      toast.success(`Reward redeemed successfully! Order ID: ${data.rye_order_id}`);
    },
    onError: (error) => {
      console.error('❌ Redemption mutation error:', error);
      toast.error(error.message || 'Failed to redeem reward. Please try again.');
    }
  });

  return {
    rewards,
    categories,
    isLoading: isLoading || categoriesLoading,
    redeemReward,
    error
  };
};
