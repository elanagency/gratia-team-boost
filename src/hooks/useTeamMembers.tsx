
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  user_id: string;
  points: number;
  recognitionsReceived: number;
  recognitionsGiven: number;
  isPending?: boolean;
}

export const useTeamMembers = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user, companyId } = useAuth();

  const fetchTeamMembers = useCallback(async () => {
    if (!user || !companyId) {
      console.log("Cannot fetch team members: No user ID or company ID available");
      return;
    }
    
    setIsLoading(true);
    try {
      console.log("Fetching team members for company:", companyId);
      
      // Get all members in one query
      const { data: members, error: membersError } = await supabase
        .from('company_members')
        .select(`
          id,
          role,
          is_admin,
          user_id,
          points
        `)
        .eq('company_id', companyId);
      
      if (membersError) {
        throw membersError;
      }
      
      console.log(`Found ${members?.length || 0} team members`);
      
      if (!members?.length) {
        setTeamMembers([]);
        return;
      }
      
      // Get user IDs for batch profile query
      const userIds = members.map(m => m.user_id);
      
      // Fetch profiles in batch
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .in('id', userIds);
      
      if (profilesError) {
        throw profilesError;
      }
      
      // Create a map for easy profile lookup
      const profileMap = new Map();
      profiles?.forEach(profile => {
        profileMap.set(profile.id, profile);
      });
      
      // Fetch emails from our edge function
      const { data: emailsResponse, error: emailsError } = await supabase.functions.invoke("get-user-emails", {
        body: { userIds },
      });
      
      if (emailsError) {
        console.error("Error fetching emails:", emailsError);
        // Continue without emails, we'll still show other user data
      }
      
      const emailsMap = emailsResponse?.emails || {};
      
      // Format team members with profile data
      const formattedMembers: TeamMember[] = members.map(member => {
        const profile = profileMap.get(member.user_id);
        const memberName = profile ? 
          `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 
          'No Name';
        
        return {
          id: member.id,
          name: memberName || 'No Name',
          email: emailsMap[member.user_id] || '', // Get email from our emails map
          role: member.is_admin ? 'Admin' : member.role || 'Member',
          user_id: member.user_id,
          points: member.points || 0,
          recognitionsReceived: 0, // Placeholder values
          recognitionsGiven: 0 // Placeholder values
        };
      });
      
      setTeamMembers(formattedMembers);
    } catch (error) {
      console.error("Error in fetchTeamMembers:", error);
      toast.error("Failed to fetch team members");
    } finally {
      setIsLoading(false);
    }
  }, [user, companyId]);

  const removeMember = useCallback(async (member: TeamMember) => {
    try {
      const { error } = await supabase
        .from('company_members')
        .delete()
        .eq('id', member.id);
        
      if (error) {
        throw error;
      }
      
      toast.success("Team member removed successfully");
      fetchTeamMembers();
    } catch (error) {
      console.error("Error in removeMember:", error);
      toast.error("Failed to remove team member");
    }
  }, [fetchTeamMembers]);

  useEffect(() => {
    if (user && companyId) {
      fetchTeamMembers();
    }
  }, [user, companyId, fetchTeamMembers]);

  return {
    teamMembers,
    isLoading,
    fetchTeamMembers,
    removeMember,
    companyId
  };
};
