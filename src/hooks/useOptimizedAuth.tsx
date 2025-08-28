
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState, useMemo } from 'react';

type UserProfile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  company_id: string | null;
  company_name: string;
  is_admin: boolean;
  is_platform_admin: boolean;
};

export const useOptimizedAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  // Stable user ID to prevent unnecessary re-renders
  const userId = useMemo(() => user?.id || null, [user?.id]);

  // Fetch user profile data
  const { data: profile, isLoading: isProfileLoading, error: profileError } = useQuery({
    queryKey: ['user-profile', userId],
    queryFn: async () => {
      if (!userId) return null;

      console.log('Fetching user profile data for user:', userId);
      
      const [profileResponse, companyMemberResponse] = await Promise.all([
        supabase
          .from('profiles')
          .select('first_name, last_name, is_platform_admin')
          .eq('id', userId)
          .maybeSingle(),
        supabase
          .from('company_members')
          .select('company_id, is_admin')
          .eq('user_id', userId)
          .maybeSingle()
      ]);

      if (profileResponse.error) throw profileResponse.error;
      if (companyMemberResponse.error) throw companyMemberResponse.error;

      let companyName = '';
      if (companyMemberResponse.data?.company_id) {
        const { data: company, error: companyError } = await supabase
          .from('companies')
          .select('name')
          .eq('id', companyMemberResponse.data.company_id)
          .maybeSingle();
        
        if (companyError) throw companyError;
        companyName = company?.name || '';
      }

      const userProfile: UserProfile = {
        id: userId,
        first_name: profileResponse.data?.first_name || null,
        last_name: profileResponse.data?.last_name || null,
        company_id: companyMemberResponse.data?.company_id || null,
        company_name: companyName,
        is_admin: companyMemberResponse.data?.is_admin || false,
        is_platform_admin: profileResponse.data?.is_platform_admin || false,
      };
      
      console.log('Profile data fetched successfully:', userProfile);
      return userProfile;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes - data stays fresh for 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes - cache cleanup after 30 minutes
    refetchOnWindowFocus: false, // Don't refetch when window gets focus
    refetchInterval: false, // Don't auto-refetch at intervals
    retry: 3, // Retry failed requests 3 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  // Handle auth state changes
  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!mounted) return;
      
      console.log('Auth state changed:', event);
      setSession(newSession);
      setUser(newSession?.user ?? null);
      
      if (event === "SIGNED_OUT") {
        queryClient.removeQueries({ queryKey: ['user-profile'] });
      }
    });

    const getInitialSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (mounted) {
          setSession(data.session);
          setUser(data.session?.user ?? null);
        }
      } catch (error) {
        console.error("Error checking auth session:", error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    getInitialSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [queryClient]);

  // Log any profile errors
  useEffect(() => {
    if (profileError) {
      console.error('Profile fetch error:', profileError);
    }
  }, [profileError]);

  // Computed values with memoization
  const firstName = useMemo(() => profile?.first_name || '', [profile?.first_name]);
  const lastName = useMemo(() => profile?.last_name || '', [profile?.last_name]);
  const userName = useMemo(() => {
    if (firstName) {
      return `${firstName} ${lastName || ''}`.trim();
    }
    return user?.email || 'User';
  }, [firstName, lastName, user?.email]);
  
  const companyId = useMemo(() => profile?.company_id || null, [profile?.company_id]);
  const companyName = useMemo(() => profile?.company_name || '', [profile?.company_name]);
  const isAdmin = useMemo(() => profile?.is_admin || false, [profile?.is_admin]);
  const isPlatformAdmin = useMemo(() => profile?.is_platform_admin || false, [profile?.is_platform_admin]);

  const signOut = async () => {
    console.log('Signing out user');
    try {
      await supabase.auth.signOut();
    } catch (error) {
      // If logout fails (e.g., session already expired), we still want to clear local state
      console.warn('Logout failed, but clearing local state:', error);
    }
    
    // Always clear local state and queries regardless of server response
    setUser(null);
    setSession(null);
    queryClient.removeQueries({ queryKey: ['user-profile'] });
    queryClient.clear(); // Clear all cached data
  };

  return {
    user,
    session,
    isLoading,
    isAdminLoading: isProfileLoading,
    firstName,
    lastName,
    userName,
    companyId,
    companyName,
    isAdmin,
    isPlatformAdmin,
    signOut,
  };
};
