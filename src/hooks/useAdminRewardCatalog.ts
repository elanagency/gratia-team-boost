import { useGoodyProducts, GoodyProduct } from "./useGoodyProducts";
import { usePlatformSettings } from "./usePlatformSettings";
import { calculatePointsFromPrice } from "@/lib/utils";

export interface AdminReward {
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
}

export const useAdminRewardCatalog = () => {
  const { products, isLoading, error } = useGoodyProducts(1, true, true, 100);
  const { getSetting, isLoading: isLoadingSettings } = usePlatformSettings();

  // Convert GoodyProducts to AdminRewards with proper points calculation
  const rewards: AdminReward[] = (products || []).map((product: GoodyProduct) => {
    const exchangeRate = getSetting('points_to_dollar_exchange_rate') || '0.01';
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
      price: product.price
    };
  });

  return {
    rewards,
    isLoadingRewards: isLoading || isLoadingSettings,
    error
  };
};