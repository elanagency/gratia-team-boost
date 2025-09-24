import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UseRealtimeGiftCardsProps {
  environment?: 'live' | 'test';
  enabled?: boolean;
}

export const useRealtimeGiftCards = ({ environment, enabled = true }: UseRealtimeGiftCardsProps = {}) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    const channel = supabase
      .channel('gift-cards-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'goody_gift_cards',
          filter: environment ? `environment=eq.${environment}` : undefined,
        },
        (payload) => {
          console.log('Gift cards real-time update:', payload);
          
          // Invalidate relevant queries
          queryClient.invalidateQueries({ queryKey: ['goody-products'] });
          queryClient.invalidateQueries({ queryKey: ['team-rewards'] });
          queryClient.invalidateQueries({ queryKey: ['admin-rewards'] });
          
          // Show notification for new products
          if (payload.eventType === 'INSERT') {
            toast.success(`New gift card available: ${(payload.new as any)?.name}`);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'platform_product_blacklist',
        },
        (payload) => {
          console.log('Product blacklist real-time update:', payload);
          
          // Invalidate relevant queries when products are enabled/disabled
          queryClient.invalidateQueries({ queryKey: ['goody-products'] });
          queryClient.invalidateQueries({ queryKey: ['team-rewards'] });
          queryClient.invalidateQueries({ queryKey: ['admin-rewards'] });
        }
      )
      .subscribe((status) => {
        console.log('Gift cards real-time connection status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [environment, enabled, queryClient]);
};