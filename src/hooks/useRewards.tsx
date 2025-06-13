
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
  company_id: string;
  external_id: string | null;
  rye_product_url: string | null;
  created_at: string;
}

export interface RewardCategory {
  id: string;
  name: string;
  company_id: string;
}

export const useRewards = (categoryId?: string) => {
  const { user, companyId } = useAuth();
  const queryClient = useQueryClient();

  // Fetch rewards for the company
  const { data: rewards = [], isLoading, error } = useQuery({
    queryKey: ['rewards', companyId, categoryId],
    queryFn: async () => {
      if (!companyId) return [];

      if (categoryId) {
        // If categoryId is provided, join with category mappings
        const { data, error } = await supabase
          .from('reward_category_mappings')
          .select('reward:reward_id(*)')
          .eq('category_id', categoryId);

        if (error) {
          console.error('Error fetching rewards by category:', error);
          throw error;
        }

        // Extract the rewards from the result
        return data ? data.map((item: any) => item.reward) : [];
      } else {
        // If no categoryId, fetch all rewards for the company
        const { data, error } = await supabase
          .from('rewards')
          .select('*')
          .eq('company_id', companyId);

        if (error) {
          console.error('Error fetching rewards:', error);
          throw error;
        }

        return data || [];
      }
    },
    enabled: !!companyId
  });

  // Fetch reward categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['rewardCategories', companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from('reward_categories')
        .select('*')
        .eq('company_id', companyId);

      if (error) {
        console.error('Error fetching reward categories:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!companyId
  });

  // Redeem a reward using the Rye edge function
  const redeemReward = useMutation({
    mutationFn: async ({ rewardId, shippingAddress }: { rewardId: string, shippingAddress: any }) => {
      if (!user?.id || !rewardId) {
        throw new Error('Missing user ID or reward ID');
      }

      console.log('🎯 useRewards: Starting redemption process for reward:', rewardId);
      console.log('👤 User ID:', user.id);
      console.log('📦 Shipping Address:', JSON.stringify(shippingAddress, null, 2));

      // Call the rye-integration edge function
      console.log('🔗 Calling rye-integration edge function...');
      const { data, error } = await supabase.functions.invoke('rye-integration', {
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
      queryClient.invalidateQueries({ queryKey: ['userProfile'] }); // Refresh user points
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
