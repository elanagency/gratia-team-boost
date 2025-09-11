import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2, RefreshCw } from "lucide-react";
import { GoodyProductCard } from "@/components/platform/GoodyProductCard";
import { useGoodyProducts } from "@/hooks/useGoodyProducts";
import { usePlatformRewardSettings } from "@/hooks/usePlatformRewardSettings";
import { SyncGiftCardsDialog } from "@/components/platform/SyncGiftCardsDialog";
import { useSyncGiftCards } from "@/hooks/useSyncGiftCards";

const PlatformGiftCardsCatalog = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "enabled" | "disabled">("all");
  
  const { products, totalCount, isLoading, error } = useGoodyProducts(1, true, true, 100);
  const { blacklistedProducts, isLoadingBlacklist } = usePlatformRewardSettings();
  const { refreshCatalog, syncStatus } = useSyncGiftCards();

  // Filter products based on search term and status
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const isDisabled = blacklistedProducts.has(product.id);
    
    if (statusFilter === "disabled") return matchesSearch && isDisabled;
    if (statusFilter === "enabled") return matchesSearch && !isDisabled;
    return matchesSearch;
  });

  const disabledCount = blacklistedProducts.size;
  const enabledCount = products.length - disabledCount;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Global Gift Cards Catalog</h2>
          <p className="text-gray-500 text-sm mt-1">
            Browse and enable Goody gift cards for all companies
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshCatalog}
            disabled={syncStatus?.count !== undefined && syncStatus.count > 0}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${typeof syncStatus === 'object' && syncStatus ? 'animate-spin' : ''}`} />
            {typeof syncStatus === 'object' && syncStatus ? 'Syncing...' : 'Refresh Catalog'}
          </Button>
          <SyncGiftCardsDialog />
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-gray-900">{totalCount}</div>
          <div className="text-sm text-gray-500">Total Products</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">{enabledCount}</div>
          <div className="text-sm text-gray-500">Enabled</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-red-600">{disabledCount}</div>
          <div className="text-sm text-gray-500">Disabled</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-blue-600">{filteredProducts.length}</div>
          <div className="text-sm text-gray-500">Filtered Results</div>
        </Card>
      </div>

      {/* Search and filters */}
      <Card className="p-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by product name or brand..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={(value: "all" | "enabled" | "disabled") => setStatusFilter(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Products ({products.length})</SelectItem>
              <SelectItem value="enabled">Enabled ({enabledCount})</SelectItem>
              <SelectItem value="disabled">Disabled ({disabledCount})</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Error handling */}
      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="text-red-800 font-medium">Error loading products</div>
          <div className="text-red-600 text-sm mt-1">{error.message}</div>
        </Card>
      )}

      {/* Loading state */}
      {isLoading || isLoadingBlacklist ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="h-64 animate-pulse bg-gray-200" />
          ))}
        </div>
      ) : (
        /* Products grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <GoodyProductCard
                key={product.id}
                product={product}
              />
            ))
          ) : (
            <div className="col-span-full">
              <Card className="p-12 text-center">
                <h3 className="text-lg font-medium text-gray-800">No products found</h3>
                <p className="text-gray-500 mt-2">
                  {searchTerm || statusFilter !== "all" 
                    ? "Try adjusting your search or filter criteria" 
                    : "No products available at the moment"
                  }
                </p>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PlatformGiftCardsCatalog;