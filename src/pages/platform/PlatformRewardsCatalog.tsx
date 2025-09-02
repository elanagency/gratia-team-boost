
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { GoodyProductCard } from "@/components/platform/GoodyProductCard";
import { useGoodyProducts } from "@/hooks/useGoodyProducts";
import { usePlatformRewardSettings } from "@/hooks/usePlatformRewardSettings";

const PlatformRewardsCatalog = () => {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGiftCards, setFilterGiftCards] = useState(false);
  
  const { products, totalCount, isLoading, error } = useGoodyProducts(page, true, filterGiftCards, filterGiftCards);
  const { enabledProducts } = usePlatformRewardSettings();

  // Filter products based on search term
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.brand.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const enabledCount = Object.keys(enabledProducts).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Global Rewards Catalog</h2>
          <p className="text-gray-500 text-sm mt-1">
            Browse and enable Goody products for all companies
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {enabledCount} {filterGiftCards ? 'gift cards' : 'products'} enabled
        </Badge>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="gift-cards-filter"
            checked={filterGiftCards}
            onCheckedChange={(checked) => setFilterGiftCards(checked === true)}
          />
          <Label htmlFor="gift-cards-filter" className="text-sm font-medium">
            Gift Cards Only {filterGiftCards && "(Fetching all pages...)"}
          </Label>
        </div>
        <div className="text-sm text-gray-500">
          Showing {filteredProducts.length} of {totalCount} {filterGiftCards ? 'gift cards' : 'products'}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center my-12">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>
              {filterGiftCards 
                ? "Fetching all gift cards across all pages..." 
                : "Loading Goody catalog..."
              }
            </span>
          </div>
        </div>
      ) : error ? (
        <Card className="p-12 text-center">
          <h3 className="text-lg font-medium text-red-600">Unable to load Goody catalog</h3>
          <p className="text-gray-500 mt-2">
            {error instanceof Error ? error.message : 'There was an error loading the product catalog. Please check your API configuration and try again.'}
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-[#F572FF] text-white rounded hover:bg-[#E551E8] transition-colors"
          >
            Retry
          </button>
        </Card>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <GoodyProductCard 
              key={product.id} 
              product={product}
            />
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <h3 className="text-lg font-medium text-gray-800">
            {searchTerm ? "No products found" : "No products available"}
          </h3>
          <p className="text-gray-500 mt-2">
            {searchTerm 
              ? "Try adjusting your search terms" 
              : "Unable to load Goody catalog at this time"
            }
          </p>
        </Card>
      )}
    </div>
  );
};

export default PlatformRewardsCatalog;
