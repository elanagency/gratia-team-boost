import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { GiftbitBrand } from "@/hooks/useGiftbitBrands";
import { getRegionFlag, getRegionCurrency } from "@/lib/regionConstants";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

interface GiftbitBrandCardProps {
  brand: GiftbitBrand;
  isBlacklisted?: boolean;
}

export const GiftbitBrandCard = ({ brand, isBlacklisted = false }: GiftbitBrandCardProps) => {
  const [isDisabled, setIsDisabled] = useState(isBlacklisted);
  const queryClient = useQueryClient();
  
  const formatPrice = (cents: number | null, currencyCode: string | null) => {
    if (!cents) return 'N/A';
    const currency = currencyCode || getRegionCurrency(brand.region_code);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100);
  };

  const toggleMutation = useMutation({
    mutationFn: async (disable: boolean) => {
      if (disable) {
        // Add to blacklist
        const { error } = await supabase
          .from('platform_product_blacklist')
          .insert({ goody_product_id: brand.id });
        if (error) throw error;
      } else {
        // Remove from blacklist
        const { error } = await supabase
          .from('platform_product_blacklist')
          .delete()
          .eq('goody_product_id', brand.id);
        if (error) throw error;
      }
    },
    onSuccess: (_, disable) => {
      setIsDisabled(disable);
      queryClient.invalidateQueries({ queryKey: ['platform-reward-blacklist'] });
      toast.success(disable ? 'Brand disabled' : 'Brand enabled');
    },
    onError: (error) => {
      console.error('Error toggling brand:', error);
      toast.error('Failed to update brand status');
    },
  });

  const priceRange = brand.price_is_variable
    ? `${formatPrice(brand.min_price_in_cents, brand.currency_code)} - ${formatPrice(brand.max_price_in_cents, brand.currency_code)}`
    : formatPrice(brand.min_price_in_cents, brand.currency_code);

  const regionFlag = getRegionFlag(brand.region_code);

  return (
    <Card className={`overflow-hidden transition-opacity ${isDisabled ? 'opacity-60' : ''}`}>
      <div className="relative aspect-[4/3] bg-muted">
        {brand.image_url ? (
          <img
            src={brand.image_url}
            alt={brand.name}
            className="w-full h-full object-contain p-4"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            No Image
          </div>
        )}
        <Badge 
          variant="secondary" 
          className="absolute top-2 right-2 text-xs"
        >
          {regionFlag} {brand.region_code}
        </Badge>
      </div>
      
      <CardContent className="p-4 space-y-3">
        <div className="space-y-1">
          <h3 className="font-semibold text-sm line-clamp-1" title={brand.name}>
            {brand.name}
          </h3>
          {brand.description && (
            <p className="text-xs text-muted-foreground line-clamp-2" title={brand.description}>
              {brand.description}
            </p>
          )}
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Price:</span>
          <span className="font-medium">{priceRange}</span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Currency:</span>
          <Badge variant="outline" className="text-xs">
            {brand.currency_code || getRegionCurrency(brand.region_code)}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-sm text-muted-foreground">
            {isDisabled ? 'Disabled' : 'Enabled'}
          </span>
          <Switch
            checked={!isDisabled}
            onCheckedChange={(checked) => toggleMutation.mutate(!checked)}
            disabled={toggleMutation.isPending}
          />
        </div>
      </CardContent>
    </Card>
  );
};
