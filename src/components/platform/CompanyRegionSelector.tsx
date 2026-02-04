import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAvailableRegions } from "@/hooks/useAvailableRegions";
import { useCompanyRegions } from "@/hooks/useCompanyRegions";
import { getRegionFlag, getRegionCurrency } from "@/lib/regionConstants";
import { Info } from "lucide-react";

interface CompanyRegionSelectorProps {
  companyId: string;
  environment?: 'test' | 'live';
}

export const CompanyRegionSelector = ({ 
  companyId, 
  environment = 'live' 
}: CompanyRegionSelectorProps) => {
  const { regions, isLoading: isLoadingRegions } = useAvailableRegions(environment);
  const { 
    regionCodes, 
    isLoading: isLoadingCompanyRegions, 
    updateRegions, 
    isUpdating 
  } = useCompanyRegions(companyId);

  const isLoading = isLoadingRegions || isLoadingCompanyRegions;

  const handleRegionToggle = (regionCode: string, checked: boolean) => {
    const newRegionCodes = checked
      ? [...regionCodes, regionCode]
      : regionCodes.filter(r => r !== regionCode);
    
    updateRegions({ companyId, regionCodes: newRegionCodes });
  };

  // Static regions to show if database regions are empty
  const staticRegions = [
    { region_code: 'AU', name: 'Australia' },
    { region_code: 'US', name: 'United States' },
    { region_code: 'CA', name: 'Canada' },
    { region_code: 'GB', name: 'United Kingdom' },
    { region_code: 'NZ', name: 'New Zealand' },
    { region_code: 'GLOBAL', name: 'Global' }
  ];

  const displayRegions = regions.length > 0 ? regions : staticRegions;

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {displayRegions.map((region) => {
          const regionCode = region.region_code;
          const isChecked = regionCodes.includes(regionCode);
          const flag = getRegionFlag(regionCode);
          const currency = getRegionCurrency(regionCode);

          return (
            <div key={regionCode} className="flex items-center space-x-3">
              <Checkbox
                id={`region-${regionCode}`}
                checked={isChecked}
                onCheckedChange={(checked) => 
                  handleRegionToggle(regionCode, checked as boolean)
                }
                disabled={isUpdating}
              />
              <Label 
                htmlFor={`region-${regionCode}`}
                className="flex items-center gap-2 cursor-pointer"
              >
                <span>{flag}</span>
                <span>{region.name}</span>
                <span className="text-muted-foreground text-xs">({currency})</span>
              </Label>
            </div>
          );
        })}
      </div>

      <div className="flex items-start gap-2 text-xs text-muted-foreground mt-2">
        <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
        <span>Team members will see gift cards from selected regions in their shop.</span>
      </div>

      {regionCodes.length === 0 && (
        <div className="text-xs text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/30 p-2 rounded border border-amber-200 dark:border-amber-800">
          No regions assigned — defaulting to Australia (AU)
        </div>
      )}
    </div>
  );
};
