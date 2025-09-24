import { useGoodyProducts, GoodyProduct } from "./useGoodyProducts";
import { usePlatformRewardSettings } from "./usePlatformRewardSettings";
import { usePlatformSettings } from "./usePlatformSettings";
import { useRealtimeGiftCards } from "./useRealtimeGiftCards";
import { useRealtimeCompanyEnvironment } from "./useRealtimeCompanyEnvironment";
import { calculatePointsFromPrice } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TeamReward {
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
}

export const useTeamRewards = () => {
  const { companyId } = useAuth();
  
  // Fetch company environment
  const { data: companyEnvironment, isLoading: isLoadingEnvironment } = useQuery({
    queryKey: ['company-environment', companyId],
    queryFn: async () => {
      if (!companyId) return 'live'; // Default fallback
      
      const { data, error } = await supabase
        .from('companies')
        .select('environment')
        .eq('id', companyId)
        .single();
        
      if (error) {
        console.error('Error fetching company environment:', error);
        return 'live'; // Default fallback
      }
      
      return data?.environment || 'live';
    },
    enabled: !!companyId
  });

  // Enable real-time updates for gift cards and company environment
  useRealtimeGiftCards({ environment: (companyEnvironment as 'live' | 'test') || 'live', enabled: !!companyId });
  useRealtimeCompanyEnvironment();

  const { products, isLoading, error } = useGoodyProducts(1, true, false, 100, companyEnvironment || 'live', false, true);
  const { blacklistedProducts, isLoadingBlacklist } = usePlatformRewardSettings();
  const { getSetting, isLoading: isLoadingSettings, isError: isSettingsError } = usePlatformSettings();

  // Filter out blacklisted products (team members only see enabled products)
  const enabledProducts = products?.filter(product => 
    !blacklistedProducts.has(product.id)
  ) || [];

  // Convert GoodyProducts to TeamRewards with proper points calculation
  // Only calculate points after settings are loaded and ensure we have valid settings
  const exchangeRate = getSetting('point_exchange_rate');
  const hasValidSettings = !isLoadingSettings && !isSettingsError && exchangeRate;
  
  const rewards: TeamReward[] = hasValidSettings ? enabledProducts.map((product: GoodyProduct) => {
    const pointsCost = calculatePointsFromPrice(product.price, exchangeRate);
    
    return {
      id: product.id,
      name: product.name,
      description: product.subtitle || product.recipient_description || '',
      points_cost: pointsCost,
      image_url: product.variants?.[0]?.image_large?.url || product.images?.[0]?.image_large?.url || '',
      stock: 999, // Goody products are typically always in stock
      company_id: null,
      external_id: product.id,
      product_url: '',
      brand_name: product.brand?.name || '',
      price: product.price,
      price_is_variable: product.price_is_variable || false,
      created_at: new Date().toISOString()
    };
  }) : [];

  return {
    rewards,
    categories: [], // No categories for now, using Goody's structure
    isLoading: isLoading || isLoadingBlacklist || isLoadingSettings || isLoadingEnvironment,
    error: error || (isSettingsError ? new Error('Settings failed to load') : null)
  };
};