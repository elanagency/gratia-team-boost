import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoodyProduct } from "@/hooks/useGoodyProducts";
import { usePlatformRewardSettings } from "@/hooks/usePlatformRewardSettings";

interface GoodyProductCardProps {
  product: GoodyProduct;
}

export const GoodyProductCard = ({ product }: GoodyProductCardProps) => {
  const { enabledProducts, enableProduct, disableProduct, updatePointsMultiplier, isUpdating } = usePlatformRewardSettings();
  
  const isEnabled = enabledProducts[product.id]?.enabled || false;
  const currentMultiplier = enabledProducts[product.id]?.pointsMultiplier || 1;
  const pointsCost = Math.round(product.price * currentMultiplier);
  const imageUrl = product.images[0]?.image_large?.url || '';

  const handleToggleEnable = () => {
    if (isEnabled) {
      disableProduct(product.id);
    } else {
      enableProduct(product.id, 1);
    }
  };

  const handleMultiplierChange = (newMultiplier: number) => {
    if (isEnabled && newMultiplier > 0) {
      updatePointsMultiplier(product.id, newMultiplier);
    }
  };

  return (
    <Card className={`transition-all ${isEnabled ? 'ring-2 ring-primary bg-primary/5' : ''}`}>
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
            <Badge variant={isEnabled ? "default" : "secondary"} className="text-xs">
              {pointsCost} pts
            </Badge>
          </div>

          {product.variants.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {product.variants.length} variants available
            </p>
          )}

          {isEnabled && (
            <div className="space-y-2">
              <Label htmlFor={`multiplier-${product.id}`} className="text-xs">
                Points per dollar
              </Label>
              <Input
                id={`multiplier-${product.id}`}
                type="number"
                value={currentMultiplier}
                onChange={(e) => handleMultiplierChange(Number(e.target.value))}
                min={0.1}
                step={0.1}
                className="h-8"
                disabled={isUpdating}
              />
            </div>
          )}

          <Button
            onClick={handleToggleEnable}
            disabled={isUpdating}
            variant={isEnabled ? "outline" : "default"}
            className="w-full"
            size="sm"
          >
            {isEnabled ? "Disable" : "Enable"} Product
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};