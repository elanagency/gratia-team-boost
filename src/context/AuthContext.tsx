
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
  isAuthLoading: boolean; // Alias for isLoading for clarity
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
  const updateSubscriptionForActiveUser = async (companyId: string, retryCount = 0) => {
    const maxRetries = 3;
    console.log(`[SUBSCRIPTION UPDATE] Starting update for company ${companyId}, attempt ${retryCount + 1}/${maxRetries + 1}`);
    
    try {
      // First check if company has an existing subscription
      console.log(`[SUBSCRIPTION UPDATE] Checking company subscription status for ${companyId}`);
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('stripe_subscription_id, subscription_status')
        .eq('id', companyId)
        .single();

      if (companyError) {
        console.error('[SUBSCRIPTION UPDATE] Error checking company subscription status:', companyError);
        return false;
      }

      console.log(`[SUBSCRIPTION UPDATE] Company data:`, companyData);

      // Only update if there's an existing active subscription
      if (companyData?.stripe_subscription_id && companyData?.subscription_status === 'active') {
        console.log(`[SUBSCRIPTION UPDATE] Found active subscription ${companyData.stripe_subscription_id}, counting active members`);
        
        // Use the dedicated function to count only non-admin active members
        const { data: activeSeats, error: countError } = await supabase
          .rpc('get_stripe_active_member_count', { company_id: companyId });

        if (countError) {
          console.error('[SUBSCRIPTION UPDATE] Error counting active seats:', countError);
          return false;
        }

        const activeSeatsCount = activeSeats || 0;
        console.log(`[SUBSCRIPTION UPDATE] Active seats count: ${activeSeatsCount}`);

        // Only update if there are active seats
        if (activeSeatsCount > 0) {
          console.log(`[SUBSCRIPTION UPDATE] Calling update-subscription function with quantity ${activeSeatsCount}`);
          
          try {
            const { data: updateResult, error: subscriptionError } = await supabase.functions.invoke('update-subscription', {
              body: {
                companyId,
                newQuantity: activeSeatsCount
              }
            });

            if (subscriptionError) {
              console.error('[SUBSCRIPTION UPDATE] Error from update-subscription function:', subscriptionError);
              
              // Retry if we haven't reached max retries and it's a temporary error
              if (retryCount < maxRetries && subscriptionError.message?.includes('count')) {
                console.log(`[SUBSCRIPTION UPDATE] Retrying in 3 seconds due to count mismatch...`);
                await new Promise(resolve => setTimeout(resolve, 3000));
                return updateSubscriptionForActiveUser(companyId, retryCount + 1);
              }
              return false;
            } else {
              console.log('[SUBSCRIPTION UPDATE] Successfully updated subscription quantity to:', activeSeatsCount);
              console.log('[SUBSCRIPTION UPDATE] Function response:', updateResult);
              return true;
            }
          } catch (error) {
            console.error('[SUBSCRIPTION UPDATE] Failed to call update-subscription function:', error);
            return false;
          }
        } else {
          console.log('[SUBSCRIPTION UPDATE] No active seats found, skipping update');
          return false;
        }
      } else {
        console.log(`[SUBSCRIPTION UPDATE] No active subscription found (subscription_id: ${companyData?.stripe_subscription_id}, status: ${companyData?.subscription_status})`);
        return false;
      }
    } catch (error) {
      console.error('[SUBSCRIPTION UPDATE] Unexpected error:', error);
      return false;
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
                  // Existing subscription: update quantity with proper delay and retry logic
                  console.log('[AUTH] Company has existing subscription, scheduling quantity update');
                  
                  // Use a more reliable approach with await and retry logic
                  (async () => {
                    console.log('[AUTH] Waiting 2 seconds for DB commit to complete...');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    console.log('[AUTH] Starting subscription update process...');
                    const updateSuccess = await updateSubscriptionForActiveUser(profile.company_id);
                    
                    if (updateSuccess) {
                      console.log('[AUTH] Subscription update completed successfully');
                    } else {
                      console.error('[AUTH] Subscription update failed');
                    }
                  })();
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
                  // Existing subscription: update quantity with proper delay and retry logic
                  console.log('[AUTH] Company has existing subscription, scheduling quantity update');
                  
                  // Use a more reliable approach with await and retry logic
                  (async () => {
                    console.log('[AUTH] Waiting 2 seconds for DB commit to complete...');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    console.log('[AUTH] Starting subscription update process...');
                    const updateSuccess = await updateSubscriptionForActiveUser(profile.company_id);
                    
                    if (updateSuccess) {
                      console.log('[AUTH] Subscription update completed successfully');
                    } else {
                      console.error('[AUTH] Subscription update failed');
                    }
                  })();
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
