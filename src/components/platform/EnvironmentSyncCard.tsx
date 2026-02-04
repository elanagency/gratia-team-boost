import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshCw, TestTube, Globe, Clock, Check, X, MapPin, CheckCheck, XCircle } from "lucide-react";
import { useSyncGiftCards } from "@/hooks/useSyncGiftCards";
import { useAvailableRegions } from "@/hooks/useAvailableRegions";
import { useSyncRegions } from "@/hooks/useSyncRegions";
import { format } from "date-fns";
import { useState } from "react";
import { getRegionFlag, getRegionName } from "@/lib/regionConstants";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface EnvironmentSyncCardProps {
  environment: 'test' | 'live';
}

// Static regions to use as fallback
const STATIC_REGIONS = [
  { region_code: 'AU', name: 'Australia' },
  { region_code: 'US', name: 'United States' },
  { region_code: 'CA', name: 'Canada' },
  { region_code: 'GB', name: 'United Kingdom' },
  { region_code: 'NZ', name: 'New Zealand' },
];

export const EnvironmentSyncCard = ({ environment }: EnvironmentSyncCardProps) => {
  const [selectedRegions, setSelectedRegions] = useState<string[]>(['AU']);
  
  const {
    syncStatus,
    syncMutation,
    testConnection,
    syncProgress,
    isLoading
  } = useSyncGiftCards(environment);

  const { regions, refetch: refetchRegions } = useAvailableRegions(environment);
  const { syncRegions, isSyncing: isSyncingRegions } = useSyncRegions(environment);
  const displayRegions = regions.length > 0 ? regions : STATIC_REGIONS;
  const regionsNeedSync = regions.length <= 1;

  // Get brand counts per region
  const giftbitEnv = environment === 'live' ? 'production' : 'testbed';
  const { data: regionCounts = {} } = useQuery({
    queryKey: ['region-brand-counts', giftbitEnv],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('giftbit_brands')
        .select('region_code')
        .eq('environment', giftbitEnv)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching region counts:', error);
        return {};
      }

      // Count brands per region
      const counts: Record<string, number> = {};
      data?.forEach(brand => {
        const code = brand.region_code;
        counts[code] = (counts[code] || 0) + 1;
      });
      return counts;
    },
    staleTime: 30000
  });

  const isLive = environment === 'live';
  const Icon = isLive ? Globe : TestTube;
  
  const handleSync = () => {
    // For now, sync all selected regions using the existing mutation
    // This will be enhanced to sync specific regions when the backend supports it
    syncMutation.mutate();
  };

  const handleTest = async () => {
    await testConnection();
  };

  const toggleRegion = (regionCode: string) => {
    setSelectedRegions(prev => 
      prev.includes(regionCode)
        ? prev.filter(r => r !== regionCode)
        : [...prev, regionCode]
    );
  };

  const allSelected = selectedRegions.length === displayRegions.length && displayRegions.length > 0;
  const noneSelected = selectedRegions.length === 0;

  const handleSelectAll = () => {
    setSelectedRegions(displayRegions.map(r => r.region_code));
  };

  const handleClearAll = () => {
    setSelectedRegions([]);
  };

  const totalSyncedBrands = Object.values(regionCounts).reduce((sum, count) => sum + count, 0);

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5" />
          <div>
            <CardTitle className="text-base lg:text-lg">
              {isLive ? 'Production' : 'Test'} Catalog
            </CardTitle>
            <CardDescription className="text-sm">
              {isLive ? 'Live gift cards for production use' : 'Test gift cards for development'}
            </CardDescription>
          </div>
        </div>
        <Badge variant={isLive ? "default" : "secondary"} className="w-fit">
          {environment.toUpperCase()}
        </Badge>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Region Selection Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Regions to Sync:</Label>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                disabled={allSelected || isLoading}
                className="h-7 px-2 text-xs"
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                disabled={noneSelected || isLoading}
                className="h-7 px-2 text-xs"
              >
                <XCircle className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {selectedRegions.length} of {displayRegions.length} regions selected
          </p>
          
          {/* Scrollable Region List */}
          <ScrollArea className="h-48 rounded-md border">
            <div className="grid grid-cols-2 gap-1.5 p-2">
              {displayRegions.map((region) => {
                const code = region.region_code;
                const flag = getRegionFlag(code);
                const count = regionCounts[code] || 0;
                const isSelected = selectedRegions.includes(code);
                
                return (
                  <div key={code} className="flex items-center space-x-1.5">
                    <Checkbox
                      id={`sync-${environment}-${code}`}
                      checked={isSelected}
                      onCheckedChange={() => toggleRegion(code)}
                      disabled={isLoading}
                      className="h-3.5 w-3.5"
                    />
                    <Label 
                      htmlFor={`sync-${environment}-${code}`}
                      className="flex items-center gap-1 cursor-pointer text-xs"
                    >
                      <span>{flag}</span>
                      <span className="truncate max-w-[60px]">{region.name}</span>
                      {count > 0 ? (
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                          <Check className="h-2.5 w-2.5" />
                          {count}
                        </span>
                      ) : (
                        <span className="text-muted-foreground flex items-center gap-0.5">
                          <X className="h-2.5 w-2.5" />
                        </span>
                      )}
                    </Label>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Sync Status */}
        <div className="flex items-center justify-between text-sm border-t pt-3">
          <span className="text-muted-foreground">Total Products:</span>
          <span className="font-medium">{totalSyncedBrands}</span>
        </div>
        
        {syncStatus?.lastSynced && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Last synced: {format(new Date(syncStatus.lastSynced), 'MMM d, yyyy HH:mm')}</span>
          </div>
        )}

        {/* Progress Bar */}
        {syncProgress.isActive && (
          <div className="space-y-2">
            <Progress value={syncProgress.progress || 0} className="h-2" />
            <p className="text-sm text-muted-foreground">{syncProgress.message}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={handleSync}
            disabled={isLoading || isSyncingRegions || selectedRegions.length === 0}
            size="sm"
            variant="default"
            className="flex-1 sm:min-w-0"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Syncing...' : `Sync ${selectedRegions.length} Region${selectedRegions.length !== 1 ? 's' : ''}`}
          </Button>
          
          <Button
            onClick={() => syncRegions()}
            disabled={isLoading || isSyncingRegions}
            size="sm"
            variant={regionsNeedSync ? "secondary" : "outline"}
            className="sm:w-auto"
          >
            <MapPin className={`mr-2 h-4 w-4 ${isSyncingRegions ? 'animate-pulse' : ''}`} />
            {isSyncingRegions ? 'Syncing...' : regionsNeedSync ? 'Sync Regions' : 'Refresh Regions'}
          </Button>
          
          <Button
            onClick={handleTest}
            disabled={isLoading || isSyncingRegions}
            size="sm"
            variant="outline"
            className="sm:w-auto"
          >
            Test API
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
