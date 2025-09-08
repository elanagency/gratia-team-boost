
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
  
  // Update login status for invited users and handle trial conversion
  useEffect(() => {
    const updateLoginStatus = async () => {
      if (!authData.user || !authData.session) return;

      try {
        // Check if user has any company memberships with 'invited' status
        const { data: invitedMemberships, error } = await supabase
          .from('company_members')
          .select('id, company_id, is_trial_user')
          .eq('user_id', authData.user.id)
          .eq('invitation_status', 'invited')
          .limit(1);

        if (error) {
          console.error('Error checking invitation status:', error);
          return;
        }

        // If user has invited memberships, update them to active on first login
        if (invitedMemberships && invitedMemberships.length > 0) {
          const membership = invitedMemberships[0];
          
          const { error: updateError } = await supabase
            .from('company_members')
            .update({
              invitation_status: 'active',
              first_login_at: new Date().toISOString()
            })
            .eq('user_id', authData.user.id)
            .eq('invitation_status', 'invited');

          if (updateError) {
            console.error('Error updating login status:', updateError);
          } else {
            console.log('Updated user invitation status to active');
            
            // If this is a trial user becoming active, trigger trial conversion
            if (membership.is_trial_user) {
              console.log('Trial user activated - triggering trial conversion');
              try {
                await supabase.functions.invoke('convert-trial-to-paid', {
                  body: {
                    companyId: membership.company_id,
                    activatedUserId: authData.user.id
                  }
                });
                console.log('Trial conversion initiated');
              } catch (conversionError) {
                console.error('Error initiating trial conversion:', conversionError);
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
