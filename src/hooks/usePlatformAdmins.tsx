
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

      // Get all platform admin profiles
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

      // Get emails using the edge function
      const userIds = profiles.map(profile => profile.id);
      
      try {
        const { data: emailsResponse, error: emailsError } = await supabase.functions.invoke('get-user-emails', {
          body: { userIds }
        });

        if (emailsError) {
          console.error('Error fetching user emails:', emailsError);
          throw emailsError;
        }

        const emails = emailsResponse?.emails || {};

        // Map profiles with their emails
        const adminProfiles: PlatformAdmin[] = profiles.map(profile => ({
          id: profile.id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          email: emails[profile.id] || 'Email not available',
          is_platform_admin: profile.is_platform_admin,
        }));

        return adminProfiles;
      } catch (error) {
        console.error('Error calling get-user-emails function:', error);
        
        // Fallback to profiles without emails if edge function fails
        const adminProfiles: PlatformAdmin[] = profiles.map(profile => ({
          id: profile.id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          email: 'Email not available',
          is_platform_admin: profile.is_platform_admin,
        }));

        return adminProfiles;
      }
    },
  });

  const addAdminMutation = useMutation({
    mutationFn: async (email: string) => {
      console.log('Adding platform admin:', email);

      const { data, error } = await supabase.functions.invoke('add-platform-admin', {
        body: { email }
      });

      if (error) {
        console.error('Error adding platform admin:', error);
        throw error;
      }

      return data;
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
