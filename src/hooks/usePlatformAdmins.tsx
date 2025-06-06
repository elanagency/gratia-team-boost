
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

      // Get email addresses from auth.users for each platform admin
      const adminEmails: PlatformAdmin[] = [];
      
      for (const profile of profiles) {
        try {
          const { data, error: userError } = await supabase.auth.admin.getUserById(profile.id);
          
          if (userError) {
            console.error('Error fetching user email:', userError);
            continue;
          }

          if (data?.user?.email) {
            adminEmails.push({
              id: profile.id,
              first_name: profile.first_name,
              last_name: profile.last_name,
              email: data.user.email,
              is_platform_admin: profile.is_platform_admin,
            });
          }
        } catch (error) {
          console.error('Error in admin user lookup:', error);
          // Continue to next user if this one fails
        }
      }

      return adminEmails;
    },
  });

  const addAdminMutation = useMutation({
    mutationFn: async (email: string) => {
      console.log('Adding platform admin:', email);

      // First, check if user exists by email
      const { data, error: userError } = await supabase.auth.admin.listUsers();
      
      if (userError) {
        console.error('Error listing users:', userError);
        throw new Error('Failed to check user existence');
      }

      const existingUser = data.users.find(user => user.email === email);
      
      if (!existingUser) {
        throw new Error('User with this email does not exist');
      }

      // Update the user's profile to make them a platform admin
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_platform_admin: true })
        .eq('id', existingUser.id);

      if (updateError) {
        console.error('Error updating platform admin status:', updateError);
        throw updateError;
      }

      return existingUser;
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
