
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export const usePlatformAuth = () => {
  const { user, isLoading } = useAuth();

  const { data: isPlatformAdmin, isLoading: isPlatformAdminLoading } = useQuery({
    queryKey: ['platform-admin-status', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;

      const { data, error } = await supabase
        .from('platform_admins')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error checking platform admin status:', error);
        return false;
      }

      return !!data;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    isPlatformAdmin: isPlatformAdmin || false,
    isPlatformAdminLoading: isLoading || isPlatformAdminLoading,
  };
};
