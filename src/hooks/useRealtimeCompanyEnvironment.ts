import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export const useRealtimeCompanyEnvironment = () => {
  const queryClient = useQueryClient();
  const { user, companyId } = useAuth();

  useEffect(() => {
    if (!user || !companyId) return;

    const channel = supabase
      .channel('company-environment-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'companies',
          filter: `id=eq.${companyId}`,
        },
        (payload) => {
          console.log('Company environment real-time update:', payload);
          
          // Check if environment changed
          if (payload.old?.environment !== payload.new?.environment) {
            // Invalidate team rewards to fetch from new environment
            queryClient.invalidateQueries({ queryKey: ['team-rewards'] });
            queryClient.invalidateQueries({ queryKey: ['company-environment'] });
          }
        }
      )
      .subscribe((status) => {
        console.log('Company environment real-time connection status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, companyId, queryClient]);
};