
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Profile {
  first_name?: string;
  last_name?: string;
  avatar_url?: string | null;
}

interface CompanyMember {
  id: string;
  role: string;
  is_admin: boolean;
  user_id: string;
}

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
    if (!userId) return;
    
    setIsLoading(true);
    try {
      // Get the company_id of the current user
      const { data: companyMember, error: memberError } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (memberError) {
        console.error("Error fetching company member:", memberError);
        throw memberError;
      }
      
      if (companyMember) {
        setCompanyId(companyMember.company_id);
        
        // Fetch company members
        const { data: members, error } = await supabase
          .from('company_members')
          .select(`
            id,
            role,
            is_admin,
            user_id
          `)
          .eq('company_id', companyMember.company_id);

        if (error) {
          console.error("Error fetching team members:", error);
          throw error;
        }
        
        // Get profiles separately for each member
        const formattedMembers: TeamMember[] = [];
        
        for (const member of members as CompanyMember[]) {
          // Fetch profile data for each member
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('first_name, last_name, avatar_url')
            .eq('id', member.user_id)
            .maybeSingle();
          
          if (profileError) {
            console.error(`Error fetching profile for user ${member.user_id}:`, profileError);
          }
          
          const profile = profileData as Profile || {};
          
          formattedMembers.push({
            id: member.id,
            name: (profile.first_name && profile.last_name) ? 
              `${profile.first_name} ${profile.last_name}`.trim() : 
              'No Name',
            email: '', // We don't have email in the profiles table
            role: member.is_admin ? 'Admin' : member.role || 'Member',
            user_id: member.user_id,
            recognitionsReceived: 0, // Placeholder for now
            recognitionsGiven: 0 // Placeholder for now
          });
        }
        
        // Now fetch pending invitations
        const { data: invitations, error: invitationError } = await supabase
          .from('team_invitations')
          .select('*')
          .eq('company_id', companyMember.company_id)
          .is('accepted_at', null);
        
        if (invitationError) {
          console.error("Error fetching team invitations:", invitationError);
        }
        
        if (invitations?.length > 0) {
          const pendingInvitations = invitations.map(invite => ({
            id: invite.id,
            name: invite.name,
            email: invite.email,
            role: invite.role || 'Member',
            isPending: true,
            user_id: invite.user_id || '',
            recognitionsReceived: 0,
            recognitionsGiven: 0
          }));
          
          setTeamMembers([...formattedMembers, ...pendingInvitations]);
        } else {
          setTeamMembers(formattedMembers);
        }
      } else {
        console.log("User is not a member of any company");
        setTeamMembers([]);
      }
    } catch (error) {
      console.error("Error in fetchTeamMembers:", error);
      toast.error("Failed to fetch team members");
    } finally {
      setIsLoading(false);
    }
  };

  const removeMember = async (member: TeamMember) => {
    try {
      // If it's a pending invitation
      if (member.isPending) {
        const { error } = await supabase
          .from('team_invitations')
          .delete()
          .eq('id', member.id);
          
        if (error) {
          console.error("Error removing invitation:", error);
          throw error;
        }
      } else {
        // If it's an actual team member
        const { error } = await supabase
          .from('company_members')
          .delete()
          .eq('id', member.id);
          
        if (error) {
          console.error("Error removing team member:", error);
          throw error;
        }
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
