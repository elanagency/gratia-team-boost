import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

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
}

export const useGiftCards = () => {
  const { companyId } = useAuth();
  
  // Fetch company environment
  const { data: companyEnvironment } = useQuery({
    queryKey: ['company-environment', companyId],
    queryFn: async () => {
      if (!companyId) return 'live';
      
      const { data, error } = await supabase
        .from('companies')
        .select('environment')
        .eq('id', companyId)
        .single();
        
      if (error) {
        console.error('Error fetching company environment:', error);
        return 'live';
      }
      
      return data?.environment || 'live';
    },
    enabled: !!companyId
  });

  // Fetch exchange rate setting
  const { data: exchangeRate } = useQuery({
    queryKey: ['point-exchange-rate'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'point_exchange_rate')
        .single();
        
      if (error) {
        console.error('Error fetching exchange rate:', error);
        return '0.03'; // fallback
      }
      
      return data?.value as string || '0.03';
    }
  });

  // Fetch gift cards
  const { data: giftCards, isLoading, error } = useQuery({
    queryKey: ['gift-cards', companyEnvironment],
    queryFn: async () => {
      const environment = companyEnvironment || 'live';
      
      const { data, error } = await supabase.functions.invoke('goody-product-service', {
        body: {
          method: 'GET_GIFT_CARDS_FROM_DB',
          environment,
          page: 1,
          per_page: 100
        }
      });

      if (error) throw error;
      
      const products = data?.products || [];
      const rate = parseFloat(exchangeRate || '0.03');
      
      // Transform to GiftCard format with proper points calculation
      const cards: GiftCard[] = products.map((product: any) => {
        const isVariablePrice = product.price_is_variable || false;
        const pointsCost = isVariablePrice ? 0 : Math.ceil(product.price / rate);
        
        return {
          id: product.id,
          name: product.name,
          description: product.subtitle || product.description || '',
          points_cost: pointsCost,
          image_url: product.image_url || '',
          stock: 999,
          company_id: null,
          external_id: product.id,
          product_url: '',
          brand_name: product.brand_name || '',
          price: product.price || 0,
          price_is_variable: isVariablePrice,
          created_at: new Date().toISOString()
        };
      });
      
      return cards;
    },
    enabled: !!companyEnvironment && !!exchangeRate
  });

  return {
    giftCards: giftCards || [],
    isLoading,
    error,
    exchangeRate: exchangeRate || '0.03'
  };
};