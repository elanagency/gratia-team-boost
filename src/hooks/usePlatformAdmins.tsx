
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PlatformAdmin {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  is_platform_admin: boolean;
}

export const usePlatformAdmins = () => {
  const queryClient = useQueryClient();

  const { data: platformAdmins, isLoading } = useQuery({
    queryKey: ['platform-admins'],
    queryFn: async () => {
      console.log('Fetching platform admins...');
      
      // First get current user to check if they're a platform admin
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Check if current user is platform admin
      const { data: currentUserProfile, error: profileError } = await supabase
        .from('profiles')
        .select('is_platform_admin')
        .eq('id', user.id)
        .single();

      if (profileError || !currentUserProfile?.is_platform_admin) {
        throw new Error('Not authorized to view platform admins');
      }

      // Get all platform admin profiles with a workaround for email
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, is_platform_admin')
        .eq('is_platform_admin', true);

      if (profilesError) {
        console.error('Error fetching platform admin profiles:', profilesError);
        throw profilesError;
      }

      if (!profiles || profiles.length === 0) {
        return [];
      }

      // For now, we'll return the profiles without emails since we can't access auth.users
      // In a real implementation, you'd need a server function or RPC to get emails
      const adminProfiles: PlatformAdmin[] = profiles.map(profile => ({
        id: profile.id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: 'Email not available', // Placeholder since we can't access auth.users directly
        is_platform_admin: profile.is_platform_admin,
      }));

      return adminProfiles;
    },
  });

  const addAdminMutation = useMutation({
    mutationFn: async (email: string) => {
      console.log('Adding platform admin:', email);

      // We can't check if user exists by email without admin privileges
      // This would need to be handled by a server function
      throw new Error('Adding platform admins requires server-side implementation');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-admins'] });
      toast.success('Platform admin added successfully');
    },
    onError: (error: any) => {
      console.error('Failed to add platform admin:', error);
      toast.error(error.message || 'Failed to add platform admin');
    },
  });

  const removeAdminMutation = useMutation({
    mutationFn: async (userId: string) => {
      console.log('Removing platform admin:', userId);

      const { error } = await supabase
        .from('profiles')
        .update({ is_platform_admin: false })
        .eq('id', userId);

      if (error) {
        console.error('Error removing platform admin status:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-admins'] });
      toast.success('Platform admin removed successfully');
    },
    onError: (error) => {
      console.error('Failed to remove platform admin:', error);
      toast.error('Failed to remove platform admin');
    },
  });

  return {
    platformAdmins: platformAdmins || [],
    isLoading,
    addAdmin: addAdminMutation.mutate,
    removeAdmin: removeAdminMutation.mutate,
    isAdding: addAdminMutation.isPending,
    isRemoving: removeAdminMutation.isPending,
  };
};
