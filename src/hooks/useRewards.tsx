
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

  // Redeem a reward
  const redeemReward = useMutation({
    mutationFn: async ({ rewardId, shippingAddress }: { rewardId: string, shippingAddress: any }) => {
      if (!user?.id || !rewardId) {
        throw new Error('Missing user ID or reward ID');
      }

      // First fetch the reward to get its points cost
      const { data: reward, error: rewardError } = await supabase
        .from('rewards')
        .select('*')
        .eq('id', rewardId)
        .single();

      if (rewardError || !reward) {
        throw new Error('Failed to fetch reward details');
      }

      // Create redemption record
      const { data, error } = await supabase
        .from('reward_redemptions')
        .insert({
          user_id: user.id,
          reward_id: rewardId,
          points_spent: reward.points_cost,
          status: 'pending',
          shipping_address: shippingAddress,
        })
        .select();

      if (error) {
        console.error('Error redeeming reward:', error);
        throw error;
      }

      // In a real implementation, we would call a Supabase Edge Function 
      // that would handle the Rye API interaction
      
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
      queryClient.invalidateQueries({ queryKey: ['redemptions'] });
      toast.success('Reward redeemed successfully!');
    },
    onError: (error) => {
      console.error('Redemption error:', error);
      toast.error('Failed to redeem reward. Please try again.');
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
