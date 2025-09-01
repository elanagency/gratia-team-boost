
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShoppingCart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GoodyProduct {
  id: string;
  name: string;
  brand: {
    id: string;
    name: string;
    shipping_price: number;
  };
  subtitle?: string;
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

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddProducts: (productIds: string[], pointsMultiplier: number) => void;
  isLoading: boolean;
}

export const AddProductDialog = ({ 
  open, 
  onOpenChange, 
  onAddProducts, 
  isLoading 
}: AddProductDialogProps) => {
  const [goodyProducts, setGoodyProducts] = useState<GoodyProduct[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [pointsMultiplier, setPointsMultiplier] = useState(1);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchGoodyProducts = async (pageNum: number = 1) => {
    setIsLoadingCatalog(true);
    try {
      const { data, error } = await supabase.functions.invoke('goody-product-service', {
        body: {},
        method: 'GET'
      });

      if (error) {
        console.error('Error fetching Goody catalog:', error);
        toast.error('Failed to load Goody catalog');
        return;
      }

      if (data?.data) {
        setGoodyProducts(data.data);
        setTotalCount(data.list_meta?.total_count || 0);
      }
    } catch (error) {
      console.error('Error fetching Goody catalog:', error);
      toast.error('Failed to load Goody catalog');
    } finally {
      setIsLoadingCatalog(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchGoodyProducts(page);
    }
  }, [open, page]);

  const handleProductSelect = (productId: string, selected: boolean) => {
    const newSelected = new Set(selectedProducts);
    if (selected) {
      newSelected.add(productId);
    } else {
      newSelected.delete(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleAddSelectedProducts = () => {
    if (selectedProducts.size === 0) {
      toast.error("Please select at least one product");
      return;
    }

    onAddProducts(Array.from(selectedProducts), pointsMultiplier);
  };

  const handleClose = () => {
    setSelectedProducts(new Set());
    setPage(1);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Browse Goody Catalog
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="pointsMultiplier">Points per dollar</Label>
              <Input
                id="pointsMultiplier"
                type="number"
                value={pointsMultiplier}
                onChange={(e) => setPointsMultiplier(Number(e.target.value))}
                min={0.1}
                step={0.1}
                className="mt-1 max-w-32"
              />
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {selectedProducts.size} selected
              </Badge>
              <Button 
                onClick={handleAddSelectedProducts} 
                disabled={isLoading || selectedProducts.size === 0}
                className="bg-primary hover:bg-primary/90"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  `Add ${selectedProducts.size} Products`
                )}
              </Button>
            </div>
          </div>

          <ScrollArea className="h-[50vh]">
            {isLoadingCatalog ? (
              <div className="flex justify-center items-center h-32">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading Goody catalog...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {goodyProducts.map((product) => {
                  const isSelected = selectedProducts.has(product.id);
                  const pointsCost = Math.round(product.price * pointsMultiplier);
                  const imageUrl = product.images[0]?.image_large?.url || '';
                  
                  return (
                    <Card 
                      key={product.id} 
                      className={`cursor-pointer transition-all ${
                        isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:shadow-md'
                      }`}
                      onClick={() => handleProductSelect(product.id, !isSelected)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleProductSelect(product.id, !!checked)}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            {imageUrl && (
                              <img 
                                src={imageUrl} 
                                alt={product.name}
                                className="w-full h-24 object-cover rounded mb-2"
                              />
                            )}
                            <h4 className="font-medium text-sm line-clamp-2 mb-1">
                              {product.name}
                            </h4>
                            <p className="text-xs text-muted-foreground mb-2">
                              {product.brand.name}
                            </p>
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-medium">
                                ${(product.price / 100).toFixed(2)}
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                {pointsCost} pts
                              </Badge>
                            </div>
                            {product.variants.length > 0 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {product.variants.length} variants
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddProductDialog;
