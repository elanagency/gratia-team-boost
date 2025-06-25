
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
  recognitionsReceived: number;
  recognitionsGiven: number;
  isPending?: boolean;
}

export const useTeamMembers = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [teamSlots, setTeamSlots] = useState({ used: 0, available: 0, total: 0 });
  const { user, companyId } = useAuth();

  const fetchTeamMembers = useCallback(async () => {
    if (!user || !companyId) {
      console.log("Cannot fetch team members: No user ID or company ID available");
      return;
    }
    
    setIsLoading(true);
    try {
      console.log("Fetching team members for company:", companyId);
      
      // Get company info with team slots
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('team_slots')
        .eq('id', companyId)
        .single();

      if (companyError) {
        console.error("Error fetching company:", companyError);
      }

      // Get all members but exclude admins from the team view
      const { data: members, error: membersError } = await supabase
        .from('company_members')
        .select(`
          id,
          is_admin,
          user_id,
          points
        `)
        .eq('company_id', companyId)
        .eq('is_admin', false); // Only get non-admin members
      
      if (membersError) {
        throw membersError;
      }
      
      console.log(`Found ${members?.length || 0} team members (excluding admins)`);
      
      const totalSlots = company?.team_slots || 0;
      const usedSlots = members?.length || 0;
      const availableSlots = Math.max(0, totalSlots - usedSlots);
      
      setTeamSlots({
        used: usedSlots,
        available: availableSlots,
        total: totalSlots
      });
      
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
      }
      
      const emailsMap = emailsResponse?.emails || {};
      
      // Fetch recognition statistics for all members
      const recognitionStats = await Promise.all(
        userIds.map(async (userId) => {
          // Count recognitions received
          const { data: received, error: receivedError } = await supabase
            .from('point_transactions')
            .select('id', { count: 'exact' })
            .eq('recipient_id', userId)
            .eq('company_id', companyId);
          
          if (receivedError) {
            console.error(`Error fetching received recognitions for user ${userId}:`, receivedError);
            return { userId, received: 0, given: 0 };
          }
          
          // Count recognitions given
          const { data: given, error: givenError } = await supabase
            .from('point_transactions')
            .select('id', { count: 'exact' })
            .eq('sender_id', userId)
            .eq('company_id', companyId);
          
          if (givenError) {
            console.error(`Error fetching given recognitions for user ${userId}:`, givenError);
            return { userId, received: received?.length || 0, given: 0 };
          }
          
          return { 
            userId, 
            received: received?.length || 0, 
            given: given?.length || 0 
          };
        })
      );
      
      // Create a map for easy recognition stats lookup
      const statsMap = new Map();
      recognitionStats.forEach(stat => {
        statsMap.set(stat.userId, stat);
      });
      
      // Format team members with profile data and recognition stats
      const formattedMembers: TeamMember[] = members.map(member => {
        const profile = profileMap.get(member.user_id);
        const stats = statsMap.get(member.user_id) || { received: 0, given: 0 };
        const memberName = profile ? 
          `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 
          'No Name';
        
        return {
          id: member.id,
          name: memberName || 'No Name',
          email: emailsMap[member.user_id] || '',
          user_id: member.user_id,
          points: member.points || 0,
          recognitionsReceived: stats.received,
          recognitionsGiven: stats.given
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
      if (!companyId) throw new Error("Company ID not found");
      
      if (member.points > 0) {
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('points_balance')
          .eq('id', companyId)
          .single();
          
        if (companyError) throw companyError;
        
        const currentBalance = companyData?.points_balance || 0;
        const newBalance = currentBalance + member.points;
        
        const { error: updateCompanyError } = await supabase
          .from('companies')
          .update({ points_balance: newBalance })
          .eq('id', companyId);
          
        if (updateCompanyError) throw updateCompanyError;
        
        const { error: transactionError } = await supabase
          .from('point_transactions')
          .insert({
            company_id: companyId,
            sender_id: member.user_id,
            recipient_id: user?.id || '',
            points: member.points,
            description: `Points returned to company when ${member.name} was removed from team.`
          });
          
        if (transactionError) throw transactionError;
      }
      
      const { error } = await supabase
        .from('company_members')
        .delete()
        .eq('id', member.id);
        
      if (error) throw error;

      toast.success(
        member.points > 0 
          ? `Team member removed successfully. ${member.points} points have been returned to the company.`
          : "Team member removed successfully."
      );
      
      fetchTeamMembers();
    } catch (error) {
      console.error("Error in removeMember:", error);
      toast.error("Failed to remove team member");
    }
  }, [fetchTeamMembers, user, companyId]);

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
    companyId,
    teamSlots
  };
};
