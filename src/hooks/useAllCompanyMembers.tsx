import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";

export interface CompanyMember {
  id: string;
  name: string;
  email: string;
  user_id: string;
  points: number;
  department?: string;
  status: 'invited' | 'active' | 'deactivated';
  first_login_at?: string;
  is_admin: boolean;
}

export const useAllCompanyMembers = () => {
  const [companyMembers, setCompanyMembers] = useState<CompanyMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user, companyId } = useAuth();

  const fetchCompanyMembers = useCallback(async () => {
    if (!user || !companyId) {
      console.log("Cannot fetch company members: No user ID or company ID available");
      return;
    }
    
    setIsLoading(true);
    try {
      console.log("Fetching all company members for company:", companyId);
      
      // Get all company members (including admins) but exclude current user
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          avatar_url,
          is_admin,
          points,
          department,
          status,
          first_login_at
        `)
        .eq('company_id', companyId)
        .eq('status', 'active')
        .neq('id', user.id) // Exclude current user
        .order('created_at', { ascending: false });
      
      if (profilesError) {
        throw profilesError;
      }
      
      console.log(`Found ${profiles?.length || 0} company members (excluding current user)`);
      
      if (!profiles?.length) {
        setCompanyMembers([]);
        return;
      }
      
      // Get user IDs for batch email query
      const userIds = profiles.map(p => p.id);
      
      // Fetch emails from our edge function
      const { data: emailsResponse, error: emailsError } = await supabase.functions.invoke("get-user-emails", {
        body: { userIds },
      });
      
      if (emailsError) {
        console.error("Error fetching emails:", emailsError);
      }
      
      const emailsMap = emailsResponse?.emails || {};
      
      // Format company members from profiles data
      const formattedMembers: CompanyMember[] = profiles.map(profile => {
        const memberName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
        
        return {
          id: profile.id,
          name: memberName || 'No Name',
          email: emailsMap[profile.id] || '',
          user_id: profile.id,
          points: profile.points || 0,
          department: profile.department || '',
          status: (profile.status as 'invited' | 'active' | 'deactivated') || 'invited',
          first_login_at: profile.first_login_at,
          is_admin: profile.is_admin || false
        };
      });
      
      setCompanyMembers(formattedMembers);
    } catch (error) {
      console.error("Error in fetchCompanyMembers:", error);
      toast.error("Failed to fetch company members");
    } finally {
      setIsLoading(false);
    }
  }, [user, companyId]);

  useEffect(() => {
    if (user && companyId) {
      fetchCompanyMembers();
    }
  }, [user, companyId, fetchCompanyMembers]);

  return {
    companyMembers,
    isLoading,
    fetchCompanyMembers
  };
};