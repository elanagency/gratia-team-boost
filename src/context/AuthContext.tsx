
import { createContext, useContext, ReactNode, useEffect } from "react";
import { Session, User } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useOptimizedAuth } from "@/hooks/useOptimizedAuth";
import { supabase } from "@/integrations/supabase/client";

// Define expanded auth context type that includes profile and company data
type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAdminLoading: boolean;
  firstName: string;
  lastName: string;
  userName: string;
  companyId: string | null;
  companyName: string;
  isAdmin: boolean;
  isPlatformAdmin: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const authData = useOptimizedAuth();
  
  // Helper function to update subscription quantity based on active users
  const updateSubscriptionForActiveUser = async (companyId: string) => {
    try {
      // Count active users in the company
      const { data: activeUsers, error: countError } = await supabase
        .from('profiles')
        .select('id', { count: 'exact' })
        .eq('company_id', companyId)
        .eq('is_active', true)
        .eq('invitation_status', 'active');

      if (countError) {
        console.error('Error counting active users for subscription update:', countError);
        return;
      }

      const activeUserCount = activeUsers?.length || 0;
      console.log(`Active user count for company ${companyId}: ${activeUserCount}`);

      // Only update if there are active users and a subscription might exist
      if (activeUserCount > 0) {
        try {
          const { error: subscriptionError } = await supabase.functions.invoke('update-subscription', {
            body: {
              companyId,
              newQuantity: activeUserCount
            }
          });

          if (subscriptionError) {
            console.error('Error updating subscription quantity:', subscriptionError);
          } else {
            console.log('Successfully updated subscription quantity to:', activeUserCount);
          }
        } catch (error) {
          console.error('Failed to call update-subscription function:', error);
        }
      }
    } catch (error) {
      console.error('Error in updateSubscriptionForActiveUser:', error);
    }
  };

  // Update login status for invited users and allocate first login points
  useEffect(() => {
    const updateLoginStatus = async () => {
      if (!authData.user || !authData.session) return;

      try {
        // Check if user profile has 'invited' status OR first_login_at is null
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id, first_login_at, invitation_status, monthly_points, company_id')
          .eq('id', authData.user.id)
          .eq('is_active', true)
          .single();

        if (error) {
          console.error('Error checking profile status:', error);
          return;
        }

        if (profile) {
          // Handle invited users becoming active
          if (profile.invitation_status === 'invited') {
            const { error: updateError } = await supabase
              .from('profiles')
              .update({
                invitation_status: 'active',
                first_login_at: new Date().toISOString(),
                monthly_points: 100 // Give 100 monthly points on first login
              })
              .eq('id', profile.id);

            if (updateError) {
              console.error('Error updating invitation status:', updateError);
            } else {
              console.log('Updated user invitation status to active and allocated 100 monthly points');
              
              // Update subscription quantity when user becomes active
              if (profile.company_id) {
                await updateSubscriptionForActiveUser(profile.company_id);
              }
            }
          }
          // Handle first login for active users who haven't logged in yet
          else if (!profile.first_login_at && profile.invitation_status === 'active') {
            const { error: updateError } = await supabase
              .from('profiles')
              .update({
                first_login_at: new Date().toISOString(),
                monthly_points: 100 // Give 100 monthly points on first login
              })
              .eq('id', profile.id);

            if (updateError) {
              console.error('Error updating first login status:', updateError);
            } else {
              console.log('Updated first login and allocated 100 monthly points');
              
              // Update subscription quantity when user becomes active
              if (profile.company_id) {
                await updateSubscriptionForActiveUser(profile.company_id);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error in login status update:', error);
      }
    };

    updateLoginStatus();
  }, [authData.user, authData.session]);

  // Enhanced signOut with navigation
  const signOut = async () => {
    await authData.signOut();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const value = {
    ...authData,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
