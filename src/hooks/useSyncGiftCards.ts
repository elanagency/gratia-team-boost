import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useSyncGiftCards = () => {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  // Get sync status
  const { data: syncStatus } = useQuery({
    queryKey: ['gift-card-sync-status'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goody_gift_cards')
        .select('last_synced_at', { count: 'exact' })
        .limit(1)
        .order('last_synced_at', { ascending: false });

      if (error) throw error;

      return {
        count: data?.length || 0,
        lastSynced: data?.[0]?.last_synced_at || null
      };
    }
  });

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('goody-product-service', {
        body: { method: 'SYNC' }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      console.log('Sync completed, invalidating cache for all gift card queries...');
      toast.success(`Sync completed! Found ${data.total_found} gift cards`);
      
      // Invalidate sync status
      queryClient.invalidateQueries({ queryKey: ['gift-card-sync-status'] });
      
      // Invalidate ALL possible goody-gift-cards query combinations
      queryClient.invalidateQueries({ 
        queryKey: ['goody-gift-cards'],
        exact: false // This will match all queries starting with 'goody-gift-cards'
      });
      
      // Force immediate refetch of the most common query pattern
      queryClient.refetchQueries({ 
        queryKey: ['goody-gift-cards', 1, true], // page 1, useSavedIds true
        exact: true
      });
      
      // Set shorter stale time to ensure fresh data
      queryClient.setQueryData(['goody-gift-cards', 1, true], undefined);
      
      console.log('Cache invalidation completed');
      setIsOpen(false);
    },
    onError: (error) => {
      console.error('Sync error:', error);
      toast.error('Sync failed. Please try again.');
    }
  });

  // Manual refresh function
  const refreshCatalog = () => {
    console.log('Manual refresh triggered...');
    
    // Clear all goody-gift-cards related cache
    queryClient.invalidateQueries({ 
      queryKey: ['goody-gift-cards'],
      exact: false 
    });
    
    // Remove cached data to force fresh fetch
    queryClient.removeQueries({ 
      queryKey: ['goody-gift-cards'],
      exact: false 
    });
    
    // Immediately refetch current page
    queryClient.refetchQueries({ 
      queryKey: ['goody-gift-cards', 1, true],
      exact: true 
    });
    
    console.log('Manual refresh completed');
    toast.success('Catalog refreshed');
  };

  return {
    isOpen,
    setIsOpen,
    syncStatus,
    syncMutation,
    refreshCatalog,
    isLoading: syncMutation.isPending
  };
};