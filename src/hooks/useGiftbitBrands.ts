import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

export type GiftbitBrand = Tables<"giftbit_brands">;

export interface UseGiftbitBrandsOptions {
  environment: 'test' | 'live';
  regionFilter?: string | null;
}

export const useGiftbitBrands = (options: UseGiftbitBrandsOptions) => {
  const { environment, regionFilter } = options;
  const giftbitEnv = environment === 'live' ? 'production' : 'testbed';
  
  const query = useQuery({
    queryKey: ['giftbit-brands', giftbitEnv, regionFilter],
    queryFn: async () => {
      let queryBuilder = supabase
        .from('giftbit_brands')
        .select('*')
        .eq('environment', giftbitEnv)
        .eq('is_active', true)
        .order('name');
      
      if (regionFilter) {
        queryBuilder = queryBuilder.eq('region_code', regionFilter);
      }
      
      const { data, error } = await queryBuilder;
      
      if (error) {
        console.error('Error fetching Giftbit brands:', error);
        throw error;
      }
      
      return data || [];
    },
    staleTime: 30000,
  });

  // Get unique regions from brands for filtering
  const regions = query.data 
    ? [...new Set(query.data.map(b => b.region_code))].sort()
    : [];

  return {
    brands: query.data || [],
    totalCount: query.data?.length || 0,
    isLoading: query.isLoading,
    error: query.error,
    regions,
    refetch: query.refetch,
  };
};

// Hook to get brand counts per region
export const useGiftbitBrandCounts = (environment: 'test' | 'live') => {
  const giftbitEnv = environment === 'live' ? 'production' : 'testbed';
  
  return useQuery({
    queryKey: ['giftbit-brand-counts', giftbitEnv],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('giftbit_brands')
        .select('region_code')
        .eq('environment', giftbitEnv)
        .eq('is_active', true);
      
      if (error) {
        console.error('Error fetching brand counts:', error);
        return { total: 0, byRegion: {} as Record<string, number> };
      }
      
      const byRegion: Record<string, number> = {};
      data?.forEach(brand => {
        const code = brand.region_code;
        byRegion[code] = (byRegion[code] || 0) + 1;
      });
      
      return {
        total: data?.length || 0,
        byRegion,
      };
    },
    staleTime: 30000,
  });
};
