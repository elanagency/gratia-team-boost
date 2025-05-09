
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserProfileData {
  firstName: string;
  lastName: string;
  userName: string;
}

export const useUserProfile = (userId: string | undefined) => {
  const [profileData, setProfileData] = useState<UserProfileData>({
    firstName: '',
    lastName: '',
    userName: ''
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userId) return;
      
      setIsLoading(true);
      try {
        // Get user profile data 
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', userId)
          .single();
        
        if (error) throw error;
        
        if (profile) {
          setProfileData({
            firstName: profile.first_name || '',
            lastName: profile.last_name || '',
            userName: `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
          });
        } else {
          // Fallback to empty values if no profile
          setProfileData({
            firstName: '',
            lastName: '',
            userName: 'User'
          });
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        toast.error("Failed to load user profile");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId]);

  return {
    ...profileData,
    isLoading
  };
};
