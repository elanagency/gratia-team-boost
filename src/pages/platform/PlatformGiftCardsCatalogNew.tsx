import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { GoodyProductCard } from "@/components/platform/GoodyProductCard";
import { useAdminRewardCatalog } from "@/hooks/useAdminRewardCatalog";

const PlatformGiftCardsCatalogNew = () => {
  const [environment, setEnvironment] = useState<'live' | 'sandbox'>('live');
  const { rewards, isLoadingRewards } = useAdminRewardCatalog(environment);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Gift Cards Catalog (NEW - Direct API)</h2>
          <p className="text-gray-500 text-sm mt-1">
            Browse gift cards loaded directly from Goody API with brand filtering. Real-time data without sync delays.
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="environment-toggle"
            checked={environment === 'live'}
            onCheckedChange={(checked) => setEnvironment(checked ? 'live' : 'sandbox')}
          />
          <Label htmlFor="environment-toggle" className="text-sm font-medium">
            {environment === 'live' ? 'Live Environment' : 'Sandbox Environment'}
          </Label>
        </div>
      </div>

      {isLoadingRewards ? (
        <div className="flex justify-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F572FF]"></div>
        </div>
      ) : rewards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rewards.map((reward) => (
            <GoodyProductCard 
              key={reward.id} 
              product={{
                id: reward.external_id,
                name: reward.name,
                price: reward.price,
                brand: { id: reward.brand_id, name: reward.brand_name, shipping_price: 0 },
                images: [{ id: "1", image_large: { url: reward.image_url, width: 300, height: 300 } }],
                variants: [],
                subtitle: reward.description,
                recipient_description: reward.description,
                price_is_variable: false
              }}
            />
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <h3 className="text-lg font-medium text-gray-800">No gift cards available</h3>
          <p className="text-gray-500 mt-2">
            Gift cards are being loaded directly from API. Please check back soon!
          </p>
        </Card>
      )}
    </div>
  );
};

export default PlatformGiftCardsCatalogNew;