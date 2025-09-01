import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EnabledProduct {
  productId: string;
  pointsMultiplier: number;
  enabled: boolean;
}

export const usePlatformRewardSettings = () => {
  const queryClient = useQueryClient();

  // Get enabled products from platform settings
  const { data: enabledProducts = {}, isLoading } = useQuery({
    queryKey: ['platform-reward-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .eq('key', 'enabled_goody_products')
        .single();

      if (error && error.code !== 'PGRST116') { // Not found is OK
        console.error('Error fetching platform reward settings:', error);
        throw error;
      }

      if (!data) {
        return {};
      }

      return JSON.parse(data.value as string) as Record<string, EnabledProduct>;
    },
  });

  // Mutation to update enabled products
  const updateEnabledProductsMutation = useMutation({
    mutationFn: async (products: Record<string, EnabledProduct>) => {
      const { error } = await supabase
        .from('platform_settings')
        .upsert({
          key: 'enabled_goody_products',
          value: JSON.stringify(products) as any,
          description: 'Enabled Goody products with their settings'
        });

      if (error) {
        console.error('Error updating platform reward settings:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-reward-settings'] });
      toast.success('Product settings updated successfully');
    },
    onError: (error: any) => {
      console.error('Failed to update product settings:', error);
      toast.error('Failed to update product settings');
    },
  });

  const enableProduct = (productId: string, pointsMultiplier: number) => {
    const newProducts = {
      ...enabledProducts,
      [productId]: {
        productId,
        pointsMultiplier,
        enabled: true
      }
    };
    updateEnabledProductsMutation.mutate(newProducts);
  };

  const disableProduct = (productId: string) => {
    const newProducts = { ...enabledProducts };
    delete newProducts[productId];
    updateEnabledProductsMutation.mutate(newProducts);
  };

  const updatePointsMultiplier = (productId: string, pointsMultiplier: number) => {
    if (!enabledProducts[productId]) return;
    
    const newProducts = {
      ...enabledProducts,
      [productId]: {
        ...enabledProducts[productId],
        pointsMultiplier
      }
    };
    updateEnabledProductsMutation.mutate(newProducts);
  };

  return {
    enabledProducts,
    isLoading,
    enableProduct,
    disableProduct,
    updatePointsMultiplier,
    isUpdating: updateEnabledProductsMutation.isPending
  };
};