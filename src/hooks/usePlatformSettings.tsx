
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

  const { data: settings, isLoading } = useQuery({
    queryKey: ['platform-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .order('key');

      if (error) {
        console.error('Error fetching platform settings:', error);
        throw error;
      }

      return data as PlatformSetting[];
    },
  });

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase
        .from('platform_settings')
        .update({ 
          value: JSON.stringify(value),
          updated_at: new Date().toISOString()
        })
        .eq('key', key);

      if (error) {
        console.error('Error updating platform setting:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-settings'] });
      queryClient.invalidateQueries({ queryKey: ['pricing'] });
      toast.success('Settings updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update settings:', error);
      toast.error('Failed to update settings');
    },
  });

  const getSetting = useCallback((key: string): string => {
    const setting = settings?.find(s => s.key === key);
    if (!setting) return '';
    
    // Handle different value formats
    if (typeof setting.value === 'string') {
      // Try to parse as JSON first
      try {
        return JSON.parse(setting.value);
      } catch (error) {
        // If parsing fails, return the raw string value
        return setting.value;
      }
    } else if (typeof setting.value === 'object' && setting.value !== null) {
      // Handle object values (like from JSONB)
      if ('data' in setting.value) {
        return setting.value.data;
      }
      // Return the first value if it's a simple object
      const values = Object.values(setting.value);
      return values.length > 0 ? String(values[0]) : '';
    }
    
    // Fallback to string conversion
    return String(setting.value || '');
  }, [settings]);

  return {
    settings,
    isLoading,
    updateSetting: updateSettingMutation.mutate,
    isUpdating: updateSettingMutation.isPending,
    getSetting,
  };
};
