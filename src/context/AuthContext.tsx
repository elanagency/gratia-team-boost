
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

// Define expanded auth context type that includes profile and company data
type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAdminLoading: boolean; // New state to track admin status loading
  firstName: string;
  lastName: string;
  userName: string;
  companyId: string | null;
  companyName: string;
  isAdmin: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdminLoading, setIsAdminLoading] = useState(true); // New state for admin status loading
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [userName, setUserName] = useState("");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Load user profile and company data when user changes
  useEffect(() => {
    const loadUserData = async () => {
      if (!user?.id) return;
      
      try {
        console.log("Loading profile data for user:", user.id);
        setIsAdminLoading(true); // Set admin loading state to true when starting to load
        
        // Fetch profile data
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', user.id)
          .maybeSingle();
        
        if (profileError) throw profileError;
        
        // Update profile state
        if (profile) {
          setFirstName(profile.first_name || '');
          setLastName(profile.last_name || '');
          setUserName(`${profile.first_name || ''} ${profile.last_name || ''}`.trim() || user.email || 'User');
        } else {
          setUserName(user.email || 'User');
        }
      
        // Fetch company data through company_members
        const { data: companyMember, error: memberError } = await supabase
          .from('company_members')
          .select('company_id, is_admin')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (memberError) throw memberError;
        
        if (companyMember?.company_id) {
          setCompanyId(companyMember.company_id);
          const adminStatus = companyMember.is_admin || false;
          console.log(`User admin status determined: ${adminStatus}`);
          setIsAdmin(adminStatus);
          
          // Fetch company name
          const { data: company, error: companyError } = await supabase
            .from('companies')
            .select('name')
            .eq('id', companyMember.company_id)
            .maybeSingle();
          
          if (companyError) throw companyError;
          
          setCompanyName(company?.name || '');
        } else {
          setError("User is not a member of any company");
          setCompanyId(null);
          setCompanyName('');
          setIsAdmin(false);
        }

        // Only set isAdminLoading to false after we've determined the admin status
        setIsAdminLoading(false);
        console.log("Admin loading completed, isAdmin:", companyMember?.is_admin || false);
      } catch (error) {
        console.error("Error loading user data:", error);
        setError(error instanceof Error ? error.message : "Unknown error");
        setIsAdminLoading(false); // Make sure we set this to false even if there's an error
      }
    };
    
    if (user) {
      loadUserData();
    } else {
      // Reset user data when logged out
      setFirstName('');
      setLastName('');
      setUserName('');
      setCompanyId(null);
      setCompanyName('');
      setIsAdmin(false);
      setError(null);
      setIsAdminLoading(false); // No admin to load if there's no user
    }
  }, [user]);

  // Handle auth state changes
  useEffect(() => {
    // 1. Set up listener first to catch auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log("Auth state changed:", event);
      
      // Update session and user state
      setSession(newSession);
      setUser(newSession?.user ?? null);
      
      // Handle signout event
      if (event === "SIGNED_OUT") {
        navigate("/login");
      }
    });

    // 2. Then check for existing session
    const getInitialSession = async () => {
      try {
        setIsLoading(true);
        const { data } = await supabase.auth.getSession();
        
        setSession(data.session);
        setUser(data.session?.user ?? null);
        
        // Redirect to login if no session on protected routes
        const path = window.location.pathname;
        if (!data.session) {
          if (path.startsWith('/dashboard')) {
            navigate("/login");
          }
        }
      } catch (error) {
        console.error("Error checking auth session:", error);
        toast.error("Failed to load session data");
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Handle error toasts
  useEffect(() => {
    if (error && !isLoading && user) {
      toast.error(error);
    }
  }, [error, isLoading, user]);

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const value = {
    user,
    session,
    isLoading,
    isAdminLoading, // Add the new state to the context value
    firstName,
    lastName, 
    userName,
    companyId,
    companyName,
    isAdmin,
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
