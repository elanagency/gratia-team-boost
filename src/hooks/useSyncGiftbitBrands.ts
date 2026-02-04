import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SyncProgress {
  isActive: boolean;
  message: string;
  currentRegion?: string;
  completedRegions: number;
  totalRegions: number;
}

export const useSyncGiftbitBrands = (environment: 'test' | 'live') => {
  const [syncProgress, setSyncProgress] = useState<SyncProgress>({
    isActive: false,
    message: '',
    completedRegions: 0,
    totalRegions: 0
  });
  const queryClient = useQueryClient();
  const giftbitEnv = environment === 'live' ? 'production' : 'testbed';

  // Get sync status from giftbit_brands table
  const { data: syncStatus, refetch: refetchStatus } = useQuery({
    queryKey: ['giftbit-sync-status', giftbitEnv],
    queryFn: async () => {
      try {
        const { data, error, count } = await supabase
          .from('giftbit_brands')
          .select('last_synced_at', { count: 'exact' })
          .eq('environment', giftbitEnv)
          .eq('is_active', true)
          .order('last_synced_at', { ascending: false })
          .limit(1);

        if (error) {
          console.error('Error fetching sync status:', error);
          throw error;
        }

        return {
          count: count || 0,
          lastSynced: data?.[0]?.last_synced_at || null
        };
      } catch (error) {
        console.error('Failed to fetch sync status:', error);
        return { count: 0, lastSynced: null };
      }
    },
    staleTime: 30000
  });

  // Sync mutation that processes each selected region
  const syncMutation = useMutation({
    mutationFn: async (selectedRegions: string[]) => {
      if (selectedRegions.length === 0) {
        throw new Error('No regions selected');
      }

      setSyncProgress({
        isActive: true,
        message: 'Starting sync...',
        completedRegions: 0,
        totalRegions: selectedRegions.length
      });

      let totalSynced = 0;
      let totalErrors = 0;
      const errorMessages: string[] = [];

      // Sync brands for each selected region
      for (let i = 0; i < selectedRegions.length; i++) {
        const region = selectedRegions[i];
        
        setSyncProgress({
          isActive: true,
          message: `Syncing ${region}...`,
          currentRegion: region,
          completedRegions: i,
          totalRegions: selectedRegions.length
        });

        try {
          const { data, error } = await supabase.functions.invoke('giftbit-brand-service', {
            body: { 
              action: 'SYNC_BRANDS', 
              environment: giftbitEnv,
              region 
            }
          });

          if (error) {
            console.error(`Error syncing region ${region}:`, error);
            totalErrors++;
            errorMessages.push(`${region}: ${error.message}`);
          } else if (!data?.success) {
            console.error(`Sync failed for region ${region}:`, data?.error);
            totalErrors++;
            errorMessages.push(`${region}: ${data?.error || 'Unknown error'}`);
          } else {
            totalSynced += data.synced || 0;
            console.log(`Synced ${data.synced} brands for region ${region}`);
          }
        } catch (err) {
          console.error(`Exception syncing region ${region}:`, err);
          totalErrors++;
          errorMessages.push(`${region}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }

      setSyncProgress({
        isActive: false,
        message: '',
        completedRegions: selectedRegions.length,
        totalRegions: selectedRegions.length
      });

      return { 
        totalSynced, 
        totalErrors, 
        regionsProcessed: selectedRegions.length,
        errorMessages 
      };
    },
    onSuccess: (result) => {
      console.log('Giftbit sync completed:', result);
      
      if (result.totalErrors > 0) {
        toast.warning(
          `Synced ${result.totalSynced} brands from ${result.regionsProcessed - result.totalErrors} regions. ${result.totalErrors} region(s) failed.`
        );
      } else if (result.totalSynced > 0) {
        toast.success(
          `Successfully synced ${result.totalSynced} brands from ${result.regionsProcessed} region${result.regionsProcessed !== 1 ? 's' : ''}`
        );
      } else {
        toast.info('Sync complete. No new brands found in selected regions.');
      }

      // Invalidate and refresh queries
      queryClient.invalidateQueries({ queryKey: ['giftbit-brands'] });
      queryClient.invalidateQueries({ queryKey: ['giftbit-sync-status', giftbitEnv] });
      queryClient.invalidateQueries({ queryKey: ['region-brand-counts', giftbitEnv] });
      refetchStatus();
    },
    onError: (error: Error) => {
      console.error('Sync mutation failed:', error);
      toast.error(`Sync failed: ${error.message}`);
      setSyncProgress({
        isActive: false,
        message: '',
        completedRegions: 0,
        totalRegions: 0
      });
    }
  });

  // Test API connection
  const testConnection = async () => {
    try {
      setSyncProgress({
        isActive: true,
        message: 'Testing API connection...',
        completedRegions: 0,
        totalRegions: 0
      });

      const { data, error } = await supabase.functions.invoke('giftbit-brand-service', {
        body: { action: 'PING', environment: giftbitEnv }
      });

      if (error || !data?.success) {
        throw new Error(data?.error || error?.message || 'Connection test failed');
      }

      toast.success('Giftbit API connection successful!');
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      toast.error(`Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    } finally {
      setSyncProgress({
        isActive: false,
        message: '',
        completedRegions: 0,
        totalRegions: 0
      });
    }
  };

  // Calculate progress percentage
  const progressPercentage = syncProgress.totalRegions > 0 
    ? Math.round((syncProgress.completedRegions / syncProgress.totalRegions) * 100)
    : 0;

  return {
    syncStatus,
    syncMutation,
    syncBrands: syncMutation.mutate,
    testConnection,
    syncProgress: {
      isActive: syncProgress.isActive,
      message: syncProgress.message,
      progress: progressPercentage,
      currentRegion: syncProgress.currentRegion
    },
    isLoading: syncMutation.isPending || syncProgress.isActive,
    refetchStatus
  };
};
