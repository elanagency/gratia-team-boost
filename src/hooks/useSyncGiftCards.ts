import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useSyncGiftCards = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{
    isActive: boolean;
    message: string;
    progress?: number;
  }>({ isActive: false, message: '' });
  const queryClient = useQueryClient();

  // Get sync status with better error handling
  const { data: syncStatus, refetch: refetchStatus } = useQuery({
    queryKey: ['gift-card-sync-status'],
    queryFn: async () => {
      try {
        const { data, error, count } = await supabase
          .from('goody_gift_cards')
          .select('last_synced_at', { count: 'exact' })
          .eq('is_active', true)
          .limit(1)
          .order('last_synced_at', { ascending: false });

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
        return {
          count: 0,
          lastSynced: null
        };
      }
    },
    staleTime: 30000, // 30 seconds
    retry: 2
  });

  // Enhanced sync mutation with better error handling
  const syncMutation = useMutation({
    mutationFn: async () => {
      setSyncProgress({ isActive: true, message: 'Starting sync...' });
      
      try {
        const { data, error } = await supabase.functions.invoke('goody-product-service', {
          body: { method: 'SYNC' }
        });

        if (error) {
          console.error('Supabase function error:', error);
          throw new Error(`Sync service error: ${error.message}`);
        }

        // Check if the response indicates an error
        if (data?.error) {
          throw new Error(data.details || data.error);
        }

        return data;
      } catch (error) {
        console.error('Sync mutation error:', error);
        throw error;
      } finally {
        setSyncProgress({ isActive: false, message: '' });
      }
    },
    onSuccess: (data) => {
      console.log('Sync completed successfully:', data);
      
      // Enhanced success message with more details
      const message = data.total_found > 0 
        ? `Sync completed! Found ${data.total_found} gift cards${data.failed_batches > 0 ? ` (${data.failed_batches} batch errors)` : ''}`
        : 'Sync completed, but no gift cards found in catalog';
      
      toast.success(message);
      
      // Invalidate and refresh queries
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['gift-card-sync-status'] }),
        queryClient.invalidateQueries({ queryKey: ['goody-gift-cards'], exact: false }),
        refetchStatus()
      ]).then(() => {
        console.log('Cache invalidation and refresh completed');
      });
      
      setIsOpen(false);
    },
    onError: (error: any) => {
      console.error('Sync failed:', error);
      
      // Enhanced error messages based on error codes
      let errorMessage = 'Sync failed. Please try again.';
      
      if (error.message) {
        if (error.message.includes('MISSING_API_KEY') || error.message.includes('INVALID_API_KEY')) {
          errorMessage = 'API key is missing or invalid. Please check your configuration.';
        } else if (error.message.includes('NETWORK_ERROR')) {
          errorMessage = 'Network connection failed. Please check your internet connection.';
        } else if (error.message.includes('API_CONNECTION_FAILED')) {
          errorMessage = 'Unable to connect to Goody API. Please try again later.';
        } else if (error.message.includes('DATABASE_ERROR')) {
          errorMessage = 'Database error occurred. Please contact support.';
        } else {
          errorMessage = `Sync failed: ${error.message}`;
        }
      }
      
      toast.error(errorMessage);
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

  // Test connection function
  const testConnection = async () => {
    try {
      setSyncProgress({ isActive: true, message: 'Testing API connection...' });
      
      const { data, error } = await supabase.functions.invoke('goody-product-service', {
        body: { method: 'GET', page: 1, per_page: 1 }
      });

      if (error || data?.error) {
        throw new Error(data?.details || error?.message || 'Connection test failed');
      }

      toast.success('API connection test successful!');
      return true;
    } catch (error: any) {
      console.error('Connection test failed:', error);
      toast.error(`Connection test failed: ${error.message}`);
      return false;
    } finally {
      setSyncProgress({ isActive: false, message: '' });
    }
  };

  return {
    isOpen,
    setIsOpen,
    syncStatus,
    syncMutation,
    refreshCatalog,
    testConnection,
    syncProgress,
    isLoading: syncMutation.isPending || syncProgress.isActive
  };
};