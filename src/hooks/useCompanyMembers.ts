import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
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

export interface CompanyMembersOptions {
  includeCurrentUser?: boolean;
  includeAdmins?: boolean;
  page?: number;
  pageSize?: number;
  activeOnly?: boolean;
}

export const useCompanyMembers = (options: CompanyMembersOptions = {}) => {
  const {
    includeCurrentUser = false,
    includeAdmins = true,
    page = 1,
    pageSize = 10,
    activeOnly = false
  } = options;

  const { user, companyId } = useAuth();
  const [teamSlots, setTeamSlots] = useState({ used: 0, available: 0, total: 0, billing_ready: false });

  const {
    data: membersData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['company-members', companyId, {
      includeCurrentUser,
      includeAdmins,
      page,
      pageSize,
      activeOnly
    }],
    queryFn: async () => {
      if (!user || !companyId) return { members: [], totalCount: 0 };

      // Build query conditions
      let query = supabase
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
        `, { count: 'exact' })
        .eq('company_id', companyId);

      if (!includeCurrentUser) {
        query = query.neq('id', user.id);
      }

      if (!includeAdmins) {
        query = query.eq('is_admin', false);
      }

      if (activeOnly) {
        query = query.eq('status', 'active');
      }

      // For pagination
      if (pageSize && page) {
        const offset = (page - 1) * pageSize;
        query = query.range(offset, offset + pageSize - 1);
      }

      query = query.order('created_at', { ascending: false });

      const { data: profiles, error: profilesError, count } = await query;

      if (profilesError) throw profilesError;

      if (!profiles?.length) {
        return { members: [], totalCount: count || 0 };
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

      return { members: formattedMembers, totalCount: count || 0 };
    },
    enabled: !!user && !!companyId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
  });

  // Fetch team slots info when needed
  useEffect(() => {
    const fetchTeamSlots = async () => {
      if (!companyId) return;

      try {
        const { data: company, error: companyError } = await supabase
          .from('companies')
          .select('stripe_subscription_id, billing_ready')
          .eq('id', companyId)
          .single();

        if (companyError) {
          console.error("Error fetching company:", companyError);
          return;
        }

        const usedMembers = membersData?.totalCount || 0;
        const hasSubscription = !!company?.stripe_subscription_id;
        const billingReady = !!company?.billing_ready;

        setTeamSlots({
          used: usedMembers,
          available: hasSubscription ? 999 : 0, // Unlimited after subscription
          total: hasSubscription ? usedMembers : 0,
          billing_ready: billingReady
        });
      } catch (error) {
        console.error("Error fetching team slots:", error);
      }
    };

    if (membersData && !includeAdmins) {
      fetchTeamSlots();
    }
  }, [companyId, membersData, includeAdmins]);

  const updateMember = useCallback(async (memberId: string, updateData: { name: string; department: string | null }) => {
    try {
      if (!companyId) throw new Error("Company ID not found");

      // Parse name into first and last name
      const nameParts = updateData.name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Update profile directly
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
      refetch();
    } catch (error) {
      console.error("Error in updateMember:", error);
      toast.error("Failed to update team member");
    }
  }, [companyId, refetch]);

  const removeMember = useCallback(async (member: CompanyMember) => {
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
      refetch();
    } catch (error) {
      console.error("Error in removeMember:", error);
      toast.error("Failed to remove team member");
    }
  }, [refetch, companyId]);

  const members = membersData?.members || [];
  const totalCount = membersData?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    companyMembers: members,
    teamMembers: members, // Alias for backward compatibility
    isLoading,
    error,
    refetch,
    updateMember,
    removeMember,
    companyId,
    teamSlots,
    totalMembers: totalCount,
    totalPages,
    currentPage: page
  };
};

// Backward compatibility hooks
export const useAllCompanyMembers = () => {
  return useCompanyMembers({
    includeCurrentUser: false,
    includeAdmins: true,
    activeOnly: true
  });
};

export const useTeamMembers = (page = 1, pageSize = 10) => {
  return useCompanyMembers({
    includeCurrentUser: false,
    includeAdmins: false,
    page,
    pageSize,
    activeOnly: true
  });
};