
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/dashboard/LoadingSpinner";

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [companyName, setCompanyName] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        const {
          data: {
            session
          }
        } = await supabase.auth.getSession();
        
        if (!session) {
          navigate("/login");
          return;
        }
        setUser(session.user);

        // Fetch company name using the security definer function
        const {
          data: companyMember
        } = await supabase.from('company_members').select('company_id').eq('user_id', session.user.id).single();
        
        if (companyMember) {
          const {
            data: company
          } = await supabase.from('companies').select('name').eq('id', companyMember.company_id).single();
          if (company) {
            setCompanyName(company.name);
          }
        }
        
        // Get user profile data 
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', session.user.id)
          .single();
        
        if (profile) {
          setFirstName(profile.first_name || '');
          setLastName(profile.last_name || '');
          setUserName(`${profile.first_name || ''} ${profile.last_name || ''}`.trim());
        } else {
          // Fallback to email if no profile name
          setUserName(session.user.email || "User");
        }
      } catch (error) {
        console.error("Error checking auth:", error);
        toast.error("Error loading user data");
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
    
    const {
      data: authListener
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        navigate("/login");
      } else if (session) {
        setUser(session.user);
      }
    });
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  if (isLoading) {
    return { user: null, companyName: "", userName: "", firstName: "", lastName: "", isLoading: true, handleLogout, LoadingComponent: <LoadingSpinner /> };
  }

  return {
    user,
    companyName,
    userName,
    firstName,
    lastName,
    isLoading,
    handleLogout,
    LoadingComponent: null
  };
};
