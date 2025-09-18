
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
  recognitionPoints: number;
  monthlyPoints: number;
  totalPoints: number;
  department: string | null;
  status: string;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const authData = useOptimizedAuth();
  
  // Helper function to check if company has existing subscription and update quantity if needed
  const updateSubscriptionForActiveUser = async (companyId: string) => {
    try {
      // First check if company has an existing subscription
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('stripe_subscription_id, subscription_status')
        .eq('id', companyId)
        .single();

      if (companyError) {
        console.error('Error checking company subscription status:', companyError);
        return;
      }

      // Only update if there's an existing active subscription
      if (companyData?.stripe_subscription_id && companyData?.subscription_status === 'active') {
        console.log(`Updating existing subscription for company ${companyId}`);
        
        // Use the dedicated function to count only non-admin active members
        const { data: activeSeats, error: countError } = await supabase
          .rpc('get_stripe_active_member_count', { company_id: companyId });

        if (countError) {
          console.error('Error counting active seats for subscription update:', countError);
          return;
        }

        const activeSeatsCount = activeSeats || 0;
        console.log(`Active seats count for company ${companyId}: ${activeSeatsCount}`);

        // Only update if there are active seats
        if (activeSeatsCount > 0) {
          try {
            const { error: subscriptionError } = await supabase.functions.invoke('update-subscription', {
              body: {
                companyId,
                newQuantity: activeSeatsCount
              }
            });

            if (subscriptionError) {
              console.error('Error updating subscription quantity:', subscriptionError);
            } else {
              console.log('Successfully updated subscription quantity to:', activeSeatsCount);
            }
          } catch (error) {
            console.error('Failed to call update-subscription function:', error);
          }
        }
      } else {
        console.log(`No active subscription found for company ${companyId}, skipping quantity update`);
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
          .select('id, first_login_at, status, monthly_points, company_id, is_admin')
          .eq('id', authData.user.id)
          .single();

        if (error) {
          console.error('Error checking profile status:', error);
          return;
        }

        if (profile) {
          // Handle invited users becoming active
          if (profile.status === 'invited') {
            const { error: updateError } = await supabase
              .from('profiles')
              .update({
                status: 'active',
                first_login_at: new Date().toISOString(),
                monthly_points: 100 // Give 100 monthly points on first login
              })
              .eq('id', profile.id);

            if (updateError) {
              console.error('Error updating invitation status:', updateError);
            } else {
              console.log('Updated user invitation status to active and allocated 100 monthly points');
              
              // Check if this is the first non-admin member login to activate billing
              if (profile.company_id && !profile.is_admin) {
                // Check if company already has a subscription to decide which action to take
                const { data: companyData } = await supabase
                  .from('companies')
                  .select('stripe_subscription_id, subscription_status')
                  .eq('id', profile.company_id)
                  .single();

                if (companyData?.stripe_subscription_id && companyData?.subscription_status === 'active') {
                  // Existing subscription: just update quantity
                  console.log('Company has existing subscription, updating quantity only');
                  await updateSubscriptionForActiveUser(profile.company_id);
                } else {
                  // No subscription: activate billing (which will create subscription)
                  console.log('No existing subscription, activating billing');
                  try {
                    const { data: activationResult } = await supabase.functions.invoke('billing-activate-on-first-login', {
                      body: { companyId: profile.company_id }
                    });
                    console.log('Billing activation result:', activationResult);
                  } catch (activationError) {
                    console.error('Error activating billing on first login:', activationError);
                  }
                }
              }
            }
          }
          // Handle first login for active users who haven't logged in yet
          else if (!profile.first_login_at && profile.status === 'active') {
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
              
              // Check if this is the first non-admin member login to activate billing
              if (profile.company_id && !profile.is_admin) {
                // Check if company already has a subscription to decide which action to take
                const { data: companyData } = await supabase
                  .from('companies')
                  .select('stripe_subscription_id, subscription_status')
                  .eq('id', profile.company_id)
                  .single();

                if (companyData?.stripe_subscription_id && companyData?.subscription_status === 'active') {
                  // Existing subscription: just update quantity
                  console.log('Company has existing subscription, updating quantity only');
                  await updateSubscriptionForActiveUser(profile.company_id);
                } else {
                  // No subscription: activate billing (which will create subscription)
                  console.log('No existing subscription, activating billing');
                  try {
                    const { data: activationResult } = await supabase.functions.invoke('billing-activate-on-first-login', {
                      body: { companyId: profile.company_id }
                    });
                    console.log('Billing activation result:', activationResult);
                  } catch (activationError) {
                    console.error('Error activating billing on first login:', activationError);
                  }
                }
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
