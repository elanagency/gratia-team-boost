import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface GoodyProduct {
  id: string;
  name: string;
  brand: {
    id: string;
    name: string;
    shipping_price: number;
  };
  subtitle?: string;
  subtitle_short?: string;
  recipient_description: string;
  variants_label?: string;
  variants_num_selectable?: number;
  variants: Array<{
    id: string;
    name: string;
    subtitle: string;
    price_cents: number;
    image_large: {
      url: string;
      width: number;
      height: number;
    };
  }>;
  images: Array<{
    id: string;
    image_large: {
      url: string;
      width: number;
      height: number;
    };
  }>;
  price: number;
  price_is_variable: boolean;
  restricted_states?: string[];
  environment?: string;
}

export const useGoodyProducts = (page: number = 1, enabled: boolean = true, useSavedIds: boolean = true, perPage: number = 20, environment: string = 'live') => {
  const query = useQuery({
    queryKey: ['goody-gift-cards', page, useSavedIds, environment],
    queryFn: async () => {
      console.log(`Fetching products for environment: ${environment}`);
      try {
        const { data, error } = await supabase.functions.invoke('goody-product-service', {
          body: {
            method: useSavedIds ? 'LOAD_FROM_DB' : 'GET',
            page,
            per_page: perPage,
            environment
          }
        });

        if (error) {
          console.error('Supabase function error:', error);
          throw new Error(`Failed to fetch products: ${error.message}`);
        }

        if (data?.error) {
          console.error('API error:', data.error);
          throw new Error(data.details || data.error);
        }

        console.log(`Received ${data?.data?.length || 0} products for ${environment} environment`);
        return {
          products: data?.data || [],
          totalCount: data?.list_meta?.total_count || 0
        };
      } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
      }
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });

  return {
    products: query.data?.products || [],
    totalCount: query.data?.totalCount || 0,
    isLoading: query.isLoading,
    error: query.error
  };
};