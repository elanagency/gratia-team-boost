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

export const useGoodyProducts = (page: number = 1, enabled: boolean = true) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['goody-products', page],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('goody-product-service', {
        body: { page, per_page: 50 }
      });

      if (error) {
        throw new Error(error.message || 'Failed to fetch Goody products');
      }

      return data as GoodyApiResponse;
    },
    enabled,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  return {
    products: data?.data || [],
    totalCount: data?.list_meta?.total_count || 0,
    isLoading,
    error
  };
};