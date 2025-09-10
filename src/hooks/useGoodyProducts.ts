import { useState, useEffect } from "react";
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
  recipient_description: string;
  variants: Array<{
    id: string;
    name: string;
    subtitle: string;
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
}

interface GoodyApiResponse {
  data: GoodyProduct[];
  list_meta: {
    total_count: number;
  };
}

export const useGoodyProducts = (page: number = 1, enabled: boolean = true, useSavedIds: boolean = true, perPage: number = 20) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['goody-gift-cards', page, useSavedIds, perPage],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('goody-product-service', {
        body: { 
          method: useSavedIds ? 'LOAD_FROM_DATABASE' : 'GET',
          page: page,
          perPage: perPage
        }
      });

      if (error) {
        console.error('Goody gift cards fetch error:', error);
        console.error('Full error details:', JSON.stringify(error, null, 2));
        throw new Error(error.message || 'Failed to fetch Goody gift cards');
      }

      if (!data) {
        console.error('No data received from edge function');
        throw new Error('No data received from gift cards service');
      }

      console.log('Raw data received:', JSON.stringify(data, null, 2));
      
      // Check if data has error property
      if (data.error) {
        console.error('Edge function returned error:', data.error);
        throw new Error(data.error);
      }

      return data as GoodyApiResponse;
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minute cache to allow quicker refreshes
    retry: 2, // Retry failed requests twice
    refetchOnMount: true, // Always refetch when component mounts
  });

  const products = data?.data || [];
  const totalCount = data?.list_meta?.total_count ?? products.length;

  return {
    products,
    totalCount,
    isLoading,
    error
  };
};