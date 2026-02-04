import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGeoLocation } from "@/hooks/useGeoLocation";
import { useAvailableRegions } from "@/hooks/useAvailableRegions";
import { useCompanyRegions } from "@/hooks/useCompanyRegions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, MapPin, Globe, Check } from "lucide-react";
import { getRegionFlag, getRegionName, getRegionCurrency } from "@/lib/regionConstants";

interface RegionSetupDialogProps {
  open: boolean;
  companyId: string;
  onComplete: () => void;
}

export const RegionSetupDialog = ({ open, companyId, onComplete }: RegionSetupDialogProps) => {
  const { region: detectedRegion, isLoading: geoLoading, isDirectlySupported } = useGeoLocation();
  const { regions: availableRegions, isLoading: regionsLoading } = useAvailableRegions('live');
  const { addRegion } = useCompanyRegions(companyId);
  
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [includeGlobal, setIncludeGlobal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  // Set detected region once geolocation completes
  useEffect(() => {
    if (!geoLoading && detectedRegion && !selectedRegion) {
      setSelectedRegion(detectedRegion);
    }
  }, [geoLoading, detectedRegion, selectedRegion]);

  // Filter to show only primary regions in dropdown (ones we support mapping to)
  const primaryRegions = availableRegions.filter(r => 
    ['AU', 'US', 'CA', 'GB', 'NZ'].includes(r.region_code)
  );

  const handleConfirm = async () => {
    if (!selectedRegion) {
      toast.error('Please select a region');
      return;
    }

    setIsSaving(true);
    try {
      // Add primary region
      const { error: regionError } = await supabase
        .from('company_regions')
        .insert({ company_id: companyId, region_code: selectedRegion });

      if (regionError && regionError.code !== '23505') { // Ignore duplicate key error
        throw regionError;
      }

      // Add GLOBAL if checked
      if (includeGlobal) {
        const { error: globalError } = await supabase
          .from('company_regions')
          .insert({ company_id: companyId, region_code: 'GLOBAL' });

        if (globalError && globalError.code !== '23505') {
          throw globalError;
        }
      }

      // Mark region setup as complete
      const { error: updateError } = await supabase
        .from('companies')
        .update({ region_setup_complete: true })
        .eq('id', companyId);

      if (updateError) throw updateError;

      toast.success('Region settings saved!');
      onComplete();
    } catch (error: any) {
      console.error('Error saving region:', error);
      toast.error('Failed to save region settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegionChange = (value: string) => {
    setSelectedRegion(value);
    setIsChanging(false);
  };

  const isLoading = geoLoading || regionsLoading;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <span>🎉</span> Welcome to Grattia!
          </DialogTitle>
          <DialogDescription>
            Let's set up your reward region to get started.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Detecting your location...</span>
            </div>
          ) : (
            <>
              {/* Detected Region Message */}
              {isDirectlySupported && selectedRegion && !isChanging && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>We detected you're in:</span>
                </div>
              )}

              {/* Region Card with Change Button (default view) */}
              {selectedRegion && !isChanging && (
                <div className="rounded-lg border bg-muted/50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{getRegionFlag(selectedRegion)}</span>
                      <div>
                        <p className="font-medium">{getRegionName(selectedRegion)}</p>
                        <p className="text-sm text-muted-foreground">
                          Currency: {getRegionCurrency(selectedRegion)}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsChanging(true)}
                    >
                      Change
                    </Button>
                  </div>
                </div>
              )}

              {/* Region Dropdown (shown when changing or no region detected) */}
              {(isChanging || !selectedRegion) && (
                <div className="space-y-2">
                  <Label htmlFor="region">Select your region</Label>
                  <Select value={selectedRegion} onValueChange={handleRegionChange}>
                    <SelectTrigger id="region" className="w-full">
                      <SelectValue placeholder="Select your region" />
                    </SelectTrigger>
                    <SelectContent>
                      {primaryRegions.map((region) => (
                        <SelectItem key={region.region_code} value={region.region_code}>
                          <div className="flex items-center gap-2">
                            <span>{getRegionFlag(region.region_code)}</span>
                            <span>{region.name}</span>
                            <span className="text-muted-foreground">({region.currency_code})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isChanging && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setIsChanging(false)}
                      className="mt-2"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              )}

              {/* Help text about region */}
              <p className="text-xs text-muted-foreground">
                This determines which gift cards your team can redeem.
              </p>

              {/* Global Gift Cards Option */}
              <div className="flex items-start space-x-3 rounded-lg border p-4">
                <Checkbox
                  id="include-global"
                  checked={includeGlobal}
                  onCheckedChange={(checked) => setIncludeGlobal(checked === true)}
                />
                <div className="space-y-1">
                  <Label htmlFor="include-global" className="flex items-center gap-2 cursor-pointer">
                    <Globe className="h-4 w-4" />
                    Also include Global gift cards
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Visa, Mastercard, and other international options
                  </p>
                </div>
              </div>

              {/* Help Text */}
              <p className="text-xs text-muted-foreground text-center">
                Need to add more regions later? Contact support and we'll help you out.
              </p>
            </>
          )}
        </div>

        <Button 
          onClick={handleConfirm} 
          disabled={isLoading || isSaving || !selectedRegion}
          className="w-full"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Saving...
            </>
          ) : (
            'Confirm & Continue'
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
};
