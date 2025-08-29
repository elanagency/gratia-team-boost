import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export const useLoginStatusUpdate = () => {
  const { user, session } = useAuth();

  useEffect(() => {
    const updateLoginStatus = async () => {
      if (!user || !session) return;

      try {
        // Check if user has any company memberships with 'invited' status
        const { data: invitedMemberships, error } = await supabase
          .from('company_members')
          .select('id')
          .eq('user_id', user.id)
          .eq('invitation_status', 'invited')
          .limit(1);

        if (error) {
          console.error('Error checking invitation status:', error);
          return;
        }

        // If user has invited memberships, update them to active on first login
        if (invitedMemberships && invitedMemberships.length > 0) {
          const { error: updateError } = await supabase
            .from('company_members')
            .update({
              invitation_status: 'active',
              first_login_at: new Date().toISOString()
            })
            .eq('user_id', user.id)
            .eq('invitation_status', 'invited');

          if (updateError) {
            console.error('Error updating login status:', updateError);
          } else {
            console.log('Updated user invitation status to active');
          }
        }
      } catch (error) {
        console.error('Error in useLoginStatusUpdate:', error);
      }
    };

    updateLoginStatus();
  }, [user, session]);
};