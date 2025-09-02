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

export const useGoodyProducts = (page: number = 1, enabled: boolean = true, fetchAllGiftCards: boolean = false) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['goody-gift-cards', page, fetchAllGiftCards],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('goody-product-service', {
        body: { 
          method: 'GET',
          page: page,
          per_page: 50,
          fetch_all: fetchAllGiftCards
        }
      });

      if (error) {
        console.error('Goody gift cards fetch error:', error);
        throw new Error(error.message || 'Failed to fetch Goody gift cards');
      }

      return data as GoodyApiResponse;
    },
    enabled,
    staleTime: fetchAllGiftCards ? 15 * 60 * 1000 : 5 * 60 * 1000, // Cache longer for all products
    retry: 2, // Retry failed requests twice
  });

  const products = data?.data || [];

  return {
    products,
    totalCount: data?.list_meta?.total_count || 0,
    isLoading,
    error
  };
};