import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  url: string;
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  points_cost: number;
  image_url: string;
  stock?: number;
  company_id: string;
  external_id: string;
  rye_product_url: string;
}

export const useRewardCatalog = () => {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [rewardToDelete, setRewardToDelete] = useState<Reward | null>(null);

  // Fetch existing rewards
  const { data: rewards = [], isLoading: isLoadingRewards } = useQuery({
    queryKey: ['rewards', companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .eq('company_id', companyId);

      if (error) {
        console.error('Error fetching rewards:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!companyId
  });

  // Mutation to add a new product from URL
  const addProductMutation = useMutation({
    mutationFn: async ({ url, pointsMultiplier }: { url: string, pointsMultiplier: number }) => {
      setIsLoading(true);
      try {
        // Determine if it's an Amazon or Shopify URL
        const isAmazon = url.includes('amazon.com') || url.includes('amzn.to');
        const action = isAmazon ? 'requestAmazonProductByURL' : 'requestShopifyProductByURL';

        // Call the new product service
        const response = await supabase.functions.invoke('rye-product-service', {
          body: { action, url }
        });

        if (response.error) {
          throw new Error(response.error.message || 'Failed to fetch product');
        }

        // Handle the product data from the response
        if (!response.data || !response.data.product) {
          throw new Error('No product data returned from API');
        }

        const product = response.data.product as Product;

        // Calculate points based on price and multiplier
        // The price comes directly from the Rye API and may need formatting
        const priceInDollars = product.price; // The API now returns price in dollars
        const pointsCost = Math.round(priceInDollars * pointsMultiplier);

        // Store in the database
        const { data, error } = await supabase
          .from('rewards')
          .insert({
            name: product.title,
            description: product.description || 'No description available',
            image_url: product.imageUrl,
            points_cost: pointsCost,
            external_id: product.id,
            rye_product_url: product.url,
            company_id: companyId,
            stock: 10 // Default stock
          })
          .select();

        if (error) {
          throw error;
        }

        return data[0];
      } finally {
        setIsLoading(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
      setIsAddProductOpen(false);
      toast.success("Product added to your rewards catalog");
    },
    onError: (error: Error) => {
      console.error("Error adding product:", error);
      toast.error(error.message || "An error occurred while adding the product");
    }
  });

  // Mutation to delete a product
  const deleteProductMutation = useMutation({
    mutationFn: async (rewardId: string) => {
      const { error } = await supabase
        .from('rewards')
        .delete()
        .eq('id', rewardId);
      
      if (error) {
        throw error;
      }
      return rewardId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewards'] });
      toast.success("Product removed from your rewards catalog");
      setDeleteConfirmOpen(false);
      setRewardToDelete(null);
    },
    onError: (error: any) => {
      console.error("Error deleting product:", error);
      toast.error(error.message || "An error occurred while deleting the product");
    }
  });

  const handleAddProduct = (url: string, pointsMultiplier: number) => {
    addProductMutation.mutate({ url, pointsMultiplier });
  };

  const handleDeleteProduct = (reward: Reward) => {
    setRewardToDelete(reward);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteProduct = () => {
    if (rewardToDelete) {
      deleteProductMutation.mutate(rewardToDelete.id);
    }
  };

  return {
    rewards,
    isLoadingRewards,
    isAddProductOpen,
    setIsAddProductOpen,
    handleAddProduct,
    isLoading,
    handleDeleteProduct,
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    rewardToDelete,
    confirmDeleteProduct,
    isDeleting: deleteProductMutation.isPending
  };
};
