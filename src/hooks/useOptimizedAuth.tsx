
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

type UserProfile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  company_id: string | null;
  company_name: string;
  is_admin: boolean;
};

// Cache user profile data in sessionStorage
const PROFILE_CACHE_KEY = 'user_profile_cache';

const cacheProfile = (profile: UserProfile) => {
  try {
    sessionStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.warn('Failed to cache profile:', error);
  }
};

const getCachedProfile = (): UserProfile | null => {
  try {
    const cached = sessionStorage.getItem(PROFILE_CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.warn('Failed to get cached profile:', error);
    return null;
  }
};

export const useOptimizedAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  // Fetch user profile data
  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      console.log('Fetching user profile data...');
      
      // Try to get cached data first
      const cached = getCachedProfile();
      if (cached && cached.id === user.id) {
        console.log('Using cached profile data');
        // Return cached data immediately, but still fetch fresh data in background
        setTimeout(() => {
          queryClient.refetchQueries({ queryKey: ['user-profile', user.id] });
        }, 0);
        return cached;
      }

      const [profileResponse, companyMemberResponse] = await Promise.all([
        supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', user.id)
          .maybeSingle(),
        supabase
          .from('company_members')
          .select('company_id, is_admin')
          .eq('user_id', user.id)
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
        id: user.id,
        first_name: profileResponse.data?.first_name || null,
        last_name: profileResponse.data?.last_name || null,
        company_id: companyMemberResponse.data?.company_id || null,
        company_name: companyName,
        is_admin: companyMemberResponse.data?.is_admin || false,
      };

      // Cache the profile data
      cacheProfile(userProfile);
      
      return userProfile;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });

  // Handle auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log('Auth state changed:', event);
      setSession(newSession);
      setUser(newSession?.user ?? null);
      
      if (event === "SIGNED_OUT") {
        // Clear cached profile data on signout
        sessionStorage.removeItem(PROFILE_CACHE_KEY);
        queryClient.removeQueries({ queryKey: ['user-profile'] });
      }
    });

    const getInitialSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
        setUser(data.session?.user ?? null);
      } catch (error) {
        console.error("Error checking auth session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  // Computed values with memoization
  const firstName = profile?.first_name || '';
  const lastName = profile?.last_name || '';
  const userName = firstName ? `${firstName} ${lastName || ''}`.trim() : (user?.email || 'User');
  const companyId = profile?.company_id || null;
  const companyName = profile?.company_name || '';
  const isAdmin = profile?.is_admin || false;

  const signOut = async () => {
    await supabase.auth.signOut();
    sessionStorage.removeItem(PROFILE_CACHE_KEY);
    queryClient.removeQueries({ queryKey: ['user-profile'] });
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
    signOut,
  };
};
