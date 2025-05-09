import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  user_id: string;
  recognitionsReceived: number;
  recognitionsGiven: number;
  isPending?: boolean;
}

export const useTeamMembers = (userId: string | undefined) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTeamMembers = async () => {
    if (!userId) {
      console.log("No user ID provided to useTeamMembers");
      return;
    }
    
    setIsLoading(true);
    try {
      console.log("Fetching team members for user:", userId);
      
      // Get the user's company_id first
      const { data: companyMember, error: memberError } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (memberError) {
        console.error("Error fetching user's company:", memberError);
        throw memberError;
      }
      
      if (!companyMember?.company_id) {
        console.log("User is not a member of any company");
        setTeamMembers([]);
        setIsLoading(false);
        return;
      }
      
      const currentCompanyId = companyMember.company_id;
      setCompanyId(currentCompanyId);
      
      console.log("Found company ID:", currentCompanyId);
      
      // Fetch members with the updated RLS policies
      const { data: members, error: membersError } = await supabase
        .from('company_members')
        .select(`
          id,
          role,
          is_admin,
          user_id
        `)
        .eq('company_id', currentCompanyId);
      
      if (membersError) {
        console.error("Error fetching team members:", membersError);
        throw membersError;
      }
      
      console.log("Found team members:", members?.length);
      
      // Format team members with profile data
      const formattedMembers: TeamMember[] = [];
      
      for (const member of members || []) {
        // Fetch profile data for each member
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('first_name, last_name, avatar_url')
          .eq('id', member.user_id)
          .maybeSingle();
        
        if (profileError) {
          console.error(`Error fetching profile for user ${member.user_id}:`, profileError);
        }
        
        const memberName = profile ? 
          `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 
          'No Name';
        
        formattedMembers.push({
          id: member.id,
          name: memberName || 'No Name',
          email: '', // We don't have email in the profiles table
          role: member.is_admin ? 'Admin' : member.role || 'Member',
          user_id: member.user_id,
          recognitionsReceived: 0, // Placeholder values
          recognitionsGiven: 0 // Placeholder values
        });
      }
      
      setTeamMembers(formattedMembers);
    } catch (error) {
      console.error("Error in fetchTeamMembers:", error);
      toast.error("Failed to fetch team members");
    } finally {
      setIsLoading(false);
    }
  };

  const removeMember = async (member: TeamMember) => {
    try {
      const { error } = await supabase
        .from('company_members')
        .delete()
        .eq('id', member.id);
        
      if (error) {
        console.error("Error removing team member:", error);
        throw error;
      }
      
      toast.success("Team member removed successfully");
      fetchTeamMembers();
    } catch (error) {
      console.error("Error in removeMember:", error);
      toast.error("Failed to remove team member");
    }
  };

  useEffect(() => {
    if (userId) {
      fetchTeamMembers();
    }
  }, [userId]);

  return {
    teamMembers,
    isLoading,
    fetchTeamMembers,
    removeMember,
    companyId
  };
};
