import { useState } from "react";
import { useGoodyProducts } from "@/hooks/useGoodyProducts";
import { usePlatformRewardSettings } from "@/hooks/usePlatformRewardSettings";
import { useRealtimeGiftCards } from "@/hooks/useRealtimeGiftCards";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Globe, TestTube, Wifi } from "lucide-react";
import { GoodyProductCard } from "@/components/platform/GoodyProductCard";
import { EnvironmentSyncCard } from "@/components/platform/EnvironmentSyncCard";
import { LoadingSpinner } from "@/components/dashboard/LoadingSpinner";
import { Skeleton } from "@/components/ui/skeleton";

const PlatformGiftCardsCatalog = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeEnvironment, setActiveEnvironment] = useState<'test' | 'live'>('live');
  
  const { products, totalCount, isLoading, error } = useGoodyProducts(1, true, true, 100, activeEnvironment, false, true);
  const { blacklistedProducts, isLoadingBlacklist } = usePlatformRewardSettings();
  
  // Enable real-time updates for the active environment
  useRealtimeGiftCards({ environment: activeEnvironment, enabled: true });

  // Filter products based on search term and status
  const filteredProducts = products?.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const isDisabled = blacklistedProducts.has(product.id);
    
    if (statusFilter === "disabled") return matchesSearch && isDisabled;
    if (statusFilter === "enabled") return matchesSearch && !isDisabled;
    return matchesSearch;
  }) || [];

  const disabledCount = blacklistedProducts.size;
  const enabledCount = (products?.length || 0) - disabledCount;

  const refreshCatalog = () => {
    // Force refresh for the current environment
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gift Cards Catalog</h1>
          <p className="text-muted-foreground">
            Manage platform gift card catalogs for test and production environments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Wifi className="h-4 w-4 text-green-500" />
            Live Updates
          </div>
          <Button
            variant="outline"
            onClick={refreshCatalog}
            disabled={isLoading}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Environment Sync Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <EnvironmentSyncCard environment="test" />
        <EnvironmentSyncCard environment="live" />
      </div>

      {/* Environment Tabs */}
      <Tabs value={activeEnvironment} onValueChange={(value) => setActiveEnvironment(value as 'test' | 'live')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="test" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            Test Catalog
          </TabsTrigger>
          <TabsTrigger value="live" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Production Catalog
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeEnvironment} className="space-y-6">
          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalCount || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {activeEnvironment === 'live' ? 'Production' : 'Test'} environment
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Enabled</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {enabledCount}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Disabled</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {disabledCount}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Filtered Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {filteredProducts.length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search gift cards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                <SelectItem value="enabled">Enabled Only</SelectItem>
                <SelectItem value="disabled">Disabled Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Products Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="p-4">
                  <Skeleton className="h-40 w-full mb-4" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </Card>
              ))}
            </div>
          ) : error ? (
            <Card className="p-8 text-center">
              <CardDescription className="text-red-600">
                Error loading products: {error.message}
              </CardDescription>
            </Card>
          ) : filteredProducts.length === 0 ? (
            <Card className="p-8 text-center">
              <CardDescription>
                {products?.length === 0 
                  ? `No ${activeEnvironment} products found. Try syncing the ${activeEnvironment} catalog first.`
                  : "No products match your current filters."
                }
              </CardDescription>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <GoodyProductCard
                  key={`${product.id}-${activeEnvironment}`}
                  product={product}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PlatformGiftCardsCatalog;