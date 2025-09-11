
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
          // Handle invited users
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
