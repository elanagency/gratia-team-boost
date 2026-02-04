import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SyncRegionsResult {
  success: boolean;
  synced?: number;
  error?: string;
}

export const useSyncRegions = (environment: 'test' | 'live') => {
  const queryClient = useQueryClient();
  
  // Map UI environment to Giftbit environment
  const giftbitEnv = environment === 'live' ? 'production' : 'testbed';

  const syncRegionsMutation = useMutation({
    mutationFn: async (): Promise<SyncRegionsResult> => {
      const { data, error } = await supabase.functions.invoke('giftbit-brand-service', {
        body: { 
          action: 'SYNC_REGIONS', 
          environment: giftbitEnv 
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to sync regions');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Sync regions failed');
      }

      return data;
    },
    onSuccess: (data) => {
      toast.success(`Synced ${data.synced || 0} regions from Giftbit`);
      // Invalidate the available-regions query to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['available-regions', giftbitEnv] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to sync regions: ${error.message}`);
    }
  });

  return {
    syncRegions: syncRegionsMutation.mutate,
    isSyncing: syncRegionsMutation.isPending
  };
};
