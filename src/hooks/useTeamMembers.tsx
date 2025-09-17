
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  user_id: string;
  points: number;
  department?: string;
  invitation_status: 'invited' | 'active';
  is_active?: boolean;
  first_login_at?: string;
}

export const useTeamMembers = (page = 1, pageSize = 10) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [teamSlots, setTeamSlots] = useState({ used: 0, available: 0, total: 0 });
  const [totalMembers, setTotalMembers] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const { user, companyId } = useAuth();

  const fetchTeamMembers = useCallback(async () => {
    if (!user || !companyId) {
      console.log("Cannot fetch team members: No user ID or company ID available");
      return;
    }
    
    setIsLoading(true);
    try {
      console.log("Fetching team members for company:", companyId);
      
      // Get company info
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('stripe_subscription_id')
        .eq('id', companyId)
        .single();

      if (companyError) {
        console.error("Error fetching company:", companyError);
      }

      // Get total count first
      const { count: totalCount, error: countError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('is_admin', false);

      if (countError) {
        throw countError;
      }

      const total = totalCount || 0;
      setTotalMembers(total);
      setTotalPages(Math.ceil(total / pageSize));

      // Get paginated team members (non-admin profiles) directly from profiles table
      const offset = (page - 1) * pageSize;
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          avatar_url,
          is_admin,
          is_active,
          points,
          department,
          invitation_status,
          first_login_at
        `)
        .eq('company_id', companyId)
        .eq('is_admin', false)
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);
      
      if (profilesError) {
        throw profilesError;
      }
      
      console.log(`Found ${profiles?.length || 0} team members on page ${page} (excluding admins)`);
      
      const usedMembers = total;
      const hasSubscription = !!company?.stripe_subscription_id;
      
      setTeamSlots({
        used: usedMembers,
        available: hasSubscription ? 999 : 0, // Unlimited after subscription
        total: hasSubscription ? usedMembers : 0
      });
      
      if (!profiles?.length) {
        setTeamMembers([]);
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
      
      // Format team members directly from profiles data
      const formattedMembers: TeamMember[] = profiles.map(profile => {
        const memberName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
        
        return {
          id: profile.id, // Use profile.id directly instead of member.id
          name: memberName || 'No Name',
          email: emailsMap[profile.id] || '',
          user_id: profile.id,
          points: profile.points || 0,
          department: profile.department || '',
          invitation_status: (profile.invitation_status as 'invited' | 'active') || 'invited',
          is_active: profile.is_active,
          first_login_at: profile.first_login_at
        };
      });
      
      setTeamMembers(formattedMembers);
    } catch (error) {
      console.error("Error in fetchTeamMembers:", error);
      toast.error("Failed to fetch team members");
    } finally {
      setIsLoading(false);
    }
  }, [user, companyId, page, pageSize]);

  const updateMember = useCallback(async (memberId: string, updateData: { name: string; department: string | null }) => {
    try {
      if (!companyId) throw new Error("Company ID not found");
      
      // Parse name into first and last name
      const nameParts = updateData.name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      // Update profile directly (both name and department are now in profiles table)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          department: updateData.department
        })
        .eq('id', memberId);
        
      if (profileError) throw profileError;
      
      toast.success("Team member updated successfully.");
      fetchTeamMembers();
    } catch (error) {
      console.error("Error in updateMember:", error);
      toast.error("Failed to update team member");
    }
  }, [companyId, fetchTeamMembers]);

  const removeMember = useCallback(async (member: TeamMember) => {
    try {
      if (!companyId) throw new Error("Company ID not found");
      
      // Call the delete-company-member edge function for proper deletion
      const { error } = await supabase.functions.invoke('delete-company-member', {
        body: {
          companyId,
          userId: member.id
        }
      });
        
      if (error) throw error;

      toast.success("Team member removed successfully.");
      
      fetchTeamMembers();
    } catch (error) {
      console.error("Error in removeMember:", error);
      toast.error("Failed to remove team member");
    }
  }, [fetchTeamMembers, companyId]);

  useEffect(() => {
    if (user && companyId) {
      fetchTeamMembers();
    }
  }, [user, companyId, fetchTeamMembers]);

  return {
    teamMembers,
    isLoading,
    fetchTeamMembers,
    updateMember,
    removeMember,
    companyId,
    teamSlots,
    totalMembers,
    totalPages,
    currentPage: page
  };
};
