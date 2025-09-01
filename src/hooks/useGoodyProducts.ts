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

// Utility function to check if a product is a gift card
const isGiftCard = (product: GoodyProduct): boolean => {
  const searchTerms = ['gift card', 'gift certificate', 'egift'];
  const searchFields = [
    product.name,
    product.subtitle || '',
    product.recipient_description,
    product.brand.name
  ].map(field => field.toLowerCase());

  return searchTerms.some(term => 
    searchFields.some(field => field.includes(term))
  );
};

export const useGoodyProducts = (page: number = 1, enabled: boolean = true, filterGiftCards: boolean = false) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['goody-products', page],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('goody-product-service', {
        body: { 
          method: 'GET',
          page: page,
          per_page: 50 
        }
      });

      if (error) {
        console.error('Goody products fetch error:', error);
        throw new Error(error.message || 'Failed to fetch Goody products');
      }

      return data as GoodyApiResponse;
    },
    enabled,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 2, // Retry failed requests twice
  });

  const products = data?.data || [];
  const filteredProducts = filterGiftCards 
    ? products.filter(isGiftCard)
    : products;

  return {
    products: filteredProducts,
    totalCount: filterGiftCards ? filteredProducts.length : (data?.list_meta?.total_count || 0),
    isLoading,
    error
  };
};