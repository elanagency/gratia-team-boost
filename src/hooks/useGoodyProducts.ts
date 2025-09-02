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

export const useGoodyProducts = (page: number = 1, enabled: boolean = true, useSavedIds: boolean = true) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['goody-gift-cards', page, useSavedIds],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('goody-product-service', {
        body: { 
          method: useSavedIds ? 'LOAD_FROM_DATABASE' : 'GET',
          page: page,
          perPage: 50
        }
      });

      if (error) {
        console.error('Goody gift cards fetch error:', error);
        throw new Error(error.message || 'Failed to fetch Goody gift cards');
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