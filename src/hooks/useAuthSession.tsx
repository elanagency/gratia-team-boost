
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { toast } from "sonner";

export interface AuthSessionUser {
  id: string;
  email?: string;
}

export const useAuthSession = () => {
  const [user, setUser] = useState<AuthSessionUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Set up listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      // Only update state synchronously inside the listener
      setSession(newSession);
      setUser(newSession?.user ?? null);
      
      if (event === "SIGNED_OUT") {
        navigate("/login");
      }
    });
    
    // 2. Then check for existing session
    const getInitialSession = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (!initialSession) {
          // No session found, user should sign in
          setIsLoading(false);
          if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
            navigate("/login");
          }
          return;
        }
        
        setSession(initialSession);
        setUser(initialSession.user);
      } catch (error) {
        console.error("Error checking auth session:", error);
        toast.error("Error loading session data");
      } finally {
        setIsLoading(false);
      }
    };
    
    getInitialSession();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return {
    user,
    session,
    isLoading,
    handleLogout
  };
};
