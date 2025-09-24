
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCallback } from 'react';

interface PlatformSetting {
  id: string;
  key: string;
  value: any; // Can be string, object, or any JSON value
  description: string | null;
}

export const usePlatformSettings = () => {
  const queryClient = useQueryClient();

  const { data: settings, isLoading, error, isError } = useQuery({
    queryKey: ['platform-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('point_exchange_rate, monthly_price_per_team_member_in_cents')
        .eq('key', 'platform_settings')
        .single();

      if (error) {
        console.error('Error fetching platform settings:', error);
        throw error;
      }

      return data;
    },
  });

  const updatePointExchangeRateMutation = useMutation({
    mutationFn: async (rate: number) => {
      const { error } = await supabase
        .from('platform_settings')
        .update({ 
          point_exchange_rate: rate,
          updated_at: new Date().toISOString()
        })
        .eq('key', 'platform_settings');

      if (error) {
        console.error('Error updating point exchange rate:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-settings'] });
      queryClient.invalidateQueries({ queryKey: ['pricing'] });
      queryClient.invalidateQueries({ queryKey: ['rewards-shop'] });
      toast.success('Point exchange rate updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update point exchange rate:', error);
      toast.error('Failed to update point exchange rate');
    },
  });

  const updateMemberPriceMutation = useMutation({
    mutationFn: async (priceInCents: number) => {
      const { error } = await supabase
        .from('platform_settings')
        .update({ 
          monthly_price_per_team_member_in_cents: priceInCents,
          updated_at: new Date().toISOString()
        })
        .eq('key', 'platform_settings');

      if (error) {
        console.error('Error updating member price:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-settings'] });
      queryClient.invalidateQueries({ queryKey: ['pricing'] });
      toast.success('Member price updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update member price:', error);
      toast.error('Failed to update member price');
    },
  });

  // Helper functions for backward compatibility
  const getSetting = useCallback((key: string) => {
    if (key === 'point_exchange_rate') {
      return settings?.point_exchange_rate?.toString();
    }
    if (key === 'member_monthly_price_cents') {
      return settings?.monthly_price_per_team_member_in_cents?.toString();
    }
    return null;
  }, [settings]);

  const updateSetting = useCallback(({ key, value }: { key: string; value: string }) => {
    if (key === 'point_exchange_rate') {
      updatePointExchangeRateMutation.mutate(parseFloat(value));
    } else if (key === 'member_monthly_price_cents') {
      updateMemberPriceMutation.mutate(parseInt(value));
    }
  }, [updatePointExchangeRateMutation, updateMemberPriceMutation]);

  return {
    settings,
    pointExchangeRate: settings?.point_exchange_rate,
    memberPriceInCents: settings?.monthly_price_per_team_member_in_cents,
    isLoading,
    error,
    isError,
    updatePointExchangeRate: updatePointExchangeRateMutation.mutate,
    updateMemberPrice: updateMemberPriceMutation.mutate,
    isUpdatingRate: updatePointExchangeRateMutation.isPending,
    isUpdatingPrice: updateMemberPriceMutation.isPending,
    // Backward compatibility methods
    getSetting,
    updateSetting,
    isUpdating: updatePointExchangeRateMutation.isPending || updateMemberPriceMutation.isPending,
  };
};
