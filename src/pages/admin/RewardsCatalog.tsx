
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  url: string;
}

const RewardsCatalog = () => {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [productUrl, setProductUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pointsMultiplier, setPointsMultiplier] = useState(1); // Default 1 point per $1

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

        // Call the Rye integration endpoint
        const response = await supabase.functions.invoke('rye-integration', {
          body: { action, url }
        });

        if (response.error) {
          throw new Error(response.error.message || 'Failed to fetch product');
        }

        const product = response.data.product as Product;
        if (!product) {
          throw new Error('No product found');
        }

        // Calculate points based on price and multiplier
        const pointsCost = Math.round(product.price * pointsMultiplier);

        // Store in the database
        const { data, error } = await supabase
          .from('rewards')
          .insert({
            name: product.title,
            description: product.description,
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
      setProductUrl("");
      toast({
        title: "Product added",
        description: "The product has been added to your rewards catalog",
      });
    },
    onError: (error) => {
      console.error("Error adding product:", error);
      toast({
        title: "Failed to add product",
        description: error.message || "An error occurred while adding the product",
        variant: "destructive",
      });
    }
  });

  const handleAddProduct = async () => {
    if (!productUrl) {
      toast({
        title: "URL required",
        description: "Please enter a valid product URL",
        variant: "destructive",
      });
      return;
    }

    // Validate URL format
    try {
      new URL(productUrl);
    } catch (e) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL",
        variant: "destructive",
      });
      return;
    }

    addProductMutation.mutate({ url: productUrl, pointsMultiplier });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Rewards Catalog</h2>
        <Button 
          onClick={() => setIsAddProductOpen(true)}
          className="bg-[#F572FF] hover:bg-[#F572FF]/90"
        >
          Add Product
        </Button>
      </div>

      {isLoadingRewards ? (
        <div className="flex justify-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F572FF]"></div>
        </div>
      ) : rewards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rewards.map((reward) => (
            <Card key={reward.id} className="overflow-hidden">
              <div className="h-48 overflow-hidden">
                {reward.image_url ? (
                  <img 
                    src={reward.image_url} 
                    alt={reward.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="h-full bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-400">No image available</span>
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">{reward.name}</h3>
                  <div className="bg-[#F572FF]/10 text-[#F572FF] px-2 py-1 rounded font-medium">
                    {reward.points_cost} points
                  </div>
                </div>
                {reward.description && (
                  <p className="text-gray-500 text-sm mt-2 line-clamp-2">
                    {reward.description}
                  </p>
                )}
                <div className="mt-2 text-sm text-gray-500">
                  Stock: {reward.stock || 0}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <h3 className="text-lg font-medium text-gray-800">No products in catalog</h3>
          <p className="text-gray-500 mt-2">
            Add products by clicking the "Add Product" button
          </p>
        </Card>
      )}

      {/* Add Product Dialog */}
      <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Product to Rewards Catalog</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="productUrl">Product URL (Amazon or Shopify)</Label>
              <Input
                id="productUrl"
                value={productUrl}
                onChange={(e) => setProductUrl(e.target.value)}
                placeholder="https://example.com/product"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="pointsMultiplier">Points per dollar</Label>
              <Input
                id="pointsMultiplier"
                type="number"
                value={pointsMultiplier}
                onChange={(e) => setPointsMultiplier(Number(e.target.value))}
                min={0.1}
                step={0.1}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                1 point = ${1/pointsMultiplier} (e.g., for a $20 product, this would be {20 * pointsMultiplier} points)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddProductOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddProduct} 
              disabled={isLoading}
              className="bg-[#F572FF] hover:bg-[#F572FF]/90"
            >
              {isLoading ? "Adding..." : "Add Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RewardsCatalog;
