
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
  company_id: string | null;
  external_id: string;
  product_url: string;
  is_global: boolean;
}

export const usePlatformRewardCatalog = () => {
  const queryClient = useQueryClient();
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [rewardToDelete, setRewardToDelete] = useState<Reward | null>(null);

  // Fetch global rewards (platform admin manages these)
  const { data: rewards = [], isLoading: isLoadingRewards } = useQuery({
    queryKey: ['platform-rewards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .is('company_id', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching platform rewards:', error);
        throw error;
      }

      return data || [];
    }
  });

  // Mutation to add a new global product
  const addProductMutation = useMutation({
    mutationFn: async ({ url, pointsMultiplier }: { url: string, pointsMultiplier: number }) => {
      setIsLoading(true);
      try {
        // Determine if it's an Amazon or Shopify URL
        const isAmazon = url.includes('amazon.com') || url.includes('amzn.to');
        const action = isAmazon ? 'requestAmazonProductByURL' : 'requestShopifyProductByURL';

        // Product service will be implemented later
        throw new Error('Product service is currently unavailable');
      } finally {
        setIsLoading(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-rewards'] });
      setIsAddProductOpen(false);
      toast.success("Product added to global rewards catalog");
    },
    onError: (error: Error) => {
      console.error("Error adding product:", error);
      toast.error(error.message || "An error occurred while adding the product");
    }
  });

  // Mutation to delete a global product
  const deleteProductMutation = useMutation({
    mutationFn: async (rewardId: string) => {
      const { error } = await supabase
        .from('rewards')
        .delete()
        .eq('id', rewardId)
        .is('company_id', null);
      
      if (error) {
        throw error;
      }
      return rewardId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-rewards'] });
      toast.success("Product removed from global rewards catalog");
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
