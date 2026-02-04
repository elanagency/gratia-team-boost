import { useState } from "react";
import { useGiftbitBrands, useGiftbitBrandCounts } from "@/hooks/useGiftbitBrands";
import { usePlatformRewardSettings } from "@/hooks/usePlatformRewardSettings";
import { useRealtimeGiftCards } from "@/hooks/useRealtimeGiftCards";
import { useAvailableRegions } from "@/hooks/useAvailableRegions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Globe, TestTube, Wifi } from "lucide-react";
import { GiftbitBrandCard } from "@/components/platform/GiftbitBrandCard";
import { EnvironmentSyncCard } from "@/components/platform/EnvironmentSyncCard";
import { Skeleton } from "@/components/ui/skeleton";
import { getRegionFlag } from "@/lib/regionConstants";

const PlatformGiftCardsCatalog = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [activeEnvironment, setActiveEnvironment] = useState<'test' | 'live'>('live');
  
  const { brands, totalCount, isLoading, error, refetch } = useGiftbitBrands({ 
    environment: activeEnvironment,
    regionFilter: regionFilter === 'all' ? null : regionFilter
  });
  const { blacklistedProducts, isLoadingBlacklist } = usePlatformRewardSettings();
  const { data: brandCounts } = useGiftbitBrandCounts(activeEnvironment);
  const { regions } = useAvailableRegions(activeEnvironment);
  
  // Enable real-time updates for the active environment
  useRealtimeGiftCards({ environment: activeEnvironment, enabled: true });

  // Filter brands based on search term and status
  const filteredBrands = brands?.filter(brand => {
    const matchesSearch = brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (brand.description?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const isDisabled = blacklistedProducts.has(brand.id);
    
    if (statusFilter === "disabled") return matchesSearch && isDisabled;
    if (statusFilter === "enabled") return matchesSearch && !isDisabled;
    return matchesSearch;
  }) || [];

  const disabledCount = blacklistedProducts.size;
  const enabledCount = (totalCount || 0) - disabledCount;

  const refreshCatalog = () => {
    refetch();
  };

  // Get unique regions from synced brands
  const uniqueRegions = brandCounts?.byRegion 
    ? Object.keys(brandCounts.byRegion).sort()
    : [];

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Gift Cards Catalog</h1>
          <p className="text-sm lg:text-base text-muted-foreground">
            Manage Giftbit gift card catalogs for test and production environments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 text-sm text-muted-foreground">
            <Wifi className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            Live Updates
          </div>
          <Button
            variant="outline"
            onClick={refreshCatalog}
            disabled={isLoading}
            size="sm"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Environment Sync Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
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

        <TabsContent value={activeEnvironment} className="space-y-4 lg:space-y-6">
          {/* Summary Statistics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs lg:text-sm font-medium">Total Brands</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl lg:text-2xl font-bold">{brandCounts?.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {activeEnvironment === 'live' ? 'Production' : 'Test'} environment
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs lg:text-sm font-medium">Enabled</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl lg:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {enabledCount}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs lg:text-sm font-medium">Disabled</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl lg:text-2xl font-bold text-destructive">
                  {disabledCount}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs lg:text-sm font-medium">Regions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl lg:text-2xl font-bold">
                  {uniqueRegions.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  with synced brands
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search gift cards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                {uniqueRegions.map(code => (
                  <SelectItem key={code} value={code}>
                    {getRegionFlag(code)} {code} ({brandCounts?.byRegion[code] || 0})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                <SelectItem value="enabled">Enabled Only</SelectItem>
                <SelectItem value="disabled">Disabled Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Brands Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="p-4">
                  <Skeleton className="h-32 lg:h-40 w-full mb-4" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </Card>
              ))}
            </div>
          ) : error ? (
            <Card className="p-8 text-center">
              <CardDescription className="text-red-600">
                Error loading brands: {error.message}
              </CardDescription>
            </Card>
          ) : filteredBrands.length === 0 ? (
            <Card className="p-8 text-center">
              <CardDescription>
                {brands?.length === 0 
                  ? `No ${activeEnvironment} brands found. Use the sync controls above to fetch brands from Giftbit.`
                  : "No brands match your current filters."
                }
              </CardDescription>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
              {filteredBrands.map((brand) => (
                <GiftbitBrandCard
                  key={`${brand.id}-${activeEnvironment}`}
                  brand={brand}
                  isBlacklisted={blacklistedProducts.has(brand.id)}
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
