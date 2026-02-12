import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface GiftCard {
  id: string;
  name: string;
  description: string;
  points_cost: number;
  image_url: string;
  stock: number;
  company_id?: string | null;
  external_id: string;
  product_url: string;
  brand_name: string;
  price: number;
  price_is_variable: boolean;
  created_at?: string;
  min_price_in_cents?: number;
  max_price_in_cents?: number;
  currency_code?: string;
  region_code?: string;
  category?: string;
}

interface RewardsShopResponse {
  success: boolean;
  data: {
    giftCards: GiftCard[];
    exchangeRate: number;
    userContext: {
      companyId: string;
      environment: 'test' | 'live';
      assignedRegions?: string[];
      provider?: 'goody' | 'giftbit';
    };
  };
  error?: string;
}

export const useRewardsShop = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['rewards-shop'],
    queryFn: async () => {
      console.log('Fetching rewards shop data...');
      
      const { data: response, error } = await supabase.functions.invoke('get-rewards-shop');

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      const result = response as RewardsShopResponse;
      
      if (!result.success) {
        console.error('Edge function returned error:', result.error);
        throw new Error(result.error || 'Failed to fetch rewards shop data');
      }

      console.log(`Successfully fetched ${result.data.giftCards.length} gift cards`);
      return result.data;
    },
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    giftCards: data?.giftCards || [],
    exchangeRate: String(data?.exchangeRate || 0.05),
    userContext: data?.userContext,
    isLoading,
    error
  };
};