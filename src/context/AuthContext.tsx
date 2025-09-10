
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
        // Check if user has any company memberships with 'invited' status OR first_login_at is null
        const { data: memberships, error } = await supabase
          .from('company_members')
          .select('id, first_login_at, invitation_status, monthly_points')
          .eq('user_id', authData.user.id);

        if (error) {
          console.error('Error checking membership status:', error);
          return;
        }

        // Process each membership
        for (const membership of memberships || []) {
          // Handle invited users
          if (membership.invitation_status === 'invited') {
            const { error: updateError } = await supabase
              .from('company_members')
              .update({
                invitation_status: 'active',
                first_login_at: new Date().toISOString(),
                monthly_points: 100 // Give 100 monthly points on first login
              })
              .eq('id', membership.id);

            if (updateError) {
              console.error('Error updating invitation status:', updateError);
            } else {
              console.log('Updated user invitation status to active and allocated 100 monthly points');
            }
          }
          // Handle first login for active users who haven't logged in yet
          else if (!membership.first_login_at && membership.invitation_status === 'active') {
            const { error: updateError } = await supabase
              .from('company_members')
              .update({
                first_login_at: new Date().toISOString(),
                monthly_points: 100 // Give 100 monthly points on first login
              })
              .eq('id', membership.id);

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
