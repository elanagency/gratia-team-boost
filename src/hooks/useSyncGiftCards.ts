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
      toast.success(`Sync completed! Found ${data.total_found} gift cards`);
      queryClient.invalidateQueries({ queryKey: ['gift-card-sync-status'] });
      queryClient.invalidateQueries({ queryKey: ['goody-gift-cards'] });
      setIsOpen(false);
    },
    onError: (error) => {
      console.error('Sync error:', error);
      toast.error('Sync failed. Please try again.');
    }
  });

  return {
    isOpen,
    setIsOpen,
    syncStatus,
    syncMutation,
    isLoading: syncMutation.isPending
  };
};