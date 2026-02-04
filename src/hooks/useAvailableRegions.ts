import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AvailableRegion {
  id: string;
  region_code: string;
  name: string;
  currency_code: string;
  environment: string;
  is_active: boolean;
}

export const useAvailableRegions = (environment: 'test' | 'live' | 'testbed' | 'production' = 'live') => {
  // Map frontend environment to Giftbit environment
  const giftbitEnv = environment === 'live' ? 'production' : 'testbed';
  
  const { data: regions = [], isLoading, error, refetch } = useQuery({
    queryKey: ['available-regions', giftbitEnv],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('giftbit_regions')
        .select('*')
        .eq('environment', giftbitEnv)
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error fetching regions:', error);
        throw error;
      }

      return data as AvailableRegion[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    regions,
    isLoading,
    error,
    refetch
  };
};
