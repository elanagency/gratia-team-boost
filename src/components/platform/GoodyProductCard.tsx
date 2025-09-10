import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GoodyProduct } from "@/hooks/useGoodyProducts";
import { usePlatformRewardSettings } from "@/hooks/usePlatformRewardSettings";

interface GoodyProductCardProps {
  product: GoodyProduct;
}

export const GoodyProductCard = ({ product }: GoodyProductCardProps) => {
  const { blacklistedProducts, addToBlacklist, removeFromBlacklist, isUpdating } = usePlatformRewardSettings();
  
  const isDisabled = blacklistedProducts.has(product.id);
  const pointsCost = Math.round(product.price); // Default 1:1 ratio
  const imageUrl = product.images[0]?.image_large?.url || '';

  const handleToggleDisable = () => {
    if (isDisabled) {
      removeFromBlacklist(product.id);
    } else {
      addToBlacklist(product.id);
    }
  };

  return (
    <Card className={`transition-all ${isDisabled ? 'ring-2 ring-red-500 bg-red-50/50 opacity-75' : 'bg-green-50/30'}`}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {imageUrl && (
            <img 
              src={imageUrl} 
              alt={product.name}
              className="w-full h-32 object-cover rounded"
            />
          )}
          
          <div>
            <h4 className="font-medium text-sm line-clamp-2 mb-1">
              {product.name}
            </h4>
            <p className="text-xs text-muted-foreground mb-2">
              {product.brand.name}
            </p>
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
              {product.recipient_description}
            </p>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">
              ${(product.price / 100).toFixed(2)}
            </span>
            <Badge variant={isDisabled ? "destructive" : "default"} className="text-xs">
              {pointsCost} pts
            </Badge>
          </div>

          {product.variants.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {product.variants.length} variants available
            </p>
          )}

          <Button
            onClick={handleToggleDisable}
            disabled={isUpdating}
            variant={isDisabled ? "default" : "destructive"}
            className="w-full"
            size="sm"
          >
            {isDisabled ? "Enable" : "Disable"} Product
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};