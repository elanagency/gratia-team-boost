import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const usePlatformRewardSettings = () => {
  const queryClient = useQueryClient();

  // Fetch blacklisted products
  const { data: blacklistedProducts = new Set(), isLoading: isLoadingBlacklist } = useQuery({
    queryKey: ['platform-product-blacklist'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_product_blacklist')
        .select('goody_product_id');

      if (error) {
        console.error('Error fetching blacklisted products:', error);
        throw error;
      }

      return new Set(data.map(item => item.goody_product_id));
    },
  });

  // Add product to blacklist
  const addToBlacklistMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from('platform_product_blacklist')
        .insert({
          goody_product_id: productId,
          disabled_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) {
        console.error('Error adding to blacklist:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-product-blacklist'] });
      toast.success('Product disabled successfully');
    },
    onError: (error) => {
      console.error('Failed to disable product:', error);
      toast.error('Failed to disable product');
    },
  });

  // Remove product from blacklist
  const removeFromBlacklistMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from('platform_product_blacklist')
        .delete()
        .eq('goody_product_id', productId);

      if (error) {
        console.error('Error removing from blacklist:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-product-blacklist'] });
      toast.success('Product enabled successfully');
    },
    onError: (error) => {
      console.error('Failed to enable product:', error);
      toast.error('Failed to enable product');
    },
  });

  return {
    blacklistedProducts,
    isLoadingBlacklist,
    addToBlacklist: addToBlacklistMutation.mutate,
    removeFromBlacklist: removeFromBlacklistMutation.mutate,
    isUpdating: addToBlacklistMutation.isPending || removeFromBlacklistMutation.isPending,
  };
};