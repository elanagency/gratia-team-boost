
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GivePointsDialog } from "@/components/points/GivePointsDialog";
import { PointsHistory } from "@/components/points/PointsHistory";
import { LeaderboardCard } from "@/components/points/LeaderboardCard";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { TeamMembers } from "@/components/dashboard/TeamMembers";

const Dashboard = () => {
  const [teamCount, setTeamCount] = useState<number>(0);
  const [companyPoints, setCompanyPoints] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Load team member count and company points from database
  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) return;
        
        // Get user's company
        const { data: companyMember } = await supabase
          .from('company_members')
          .select('company_id')
          .eq('user_id', userData.user.id)
          .single();
        
        if (companyMember) {
          // Count team members in the same company, excluding admins
          const { count } = await supabase
            .from('company_members')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', companyMember.company_id)
            .eq('is_admin', false);
          
          // Get company points balance
          const { data: companyData } = await supabase
            .from('companies')
            .select('points_balance')
            .eq('id', companyMember.company_id)
            .single();
          
          if (count !== null) {
            setTeamCount(count);
          }
          
          if (companyData) {
            setCompanyPoints(companyData.points_balance || 0);
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
      {/* Header with Give Points button */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-xl sm:text-2xl font-bold">Dashboard</h1>
        <div className="flex-shrink-0">
          <GivePointsDialog />
        </div>
      </div>
      
      {/* Stats Grid */}
      <DashboardStats 
        teamCount={teamCount} 
        isLoading={isLoading} 
      />

      {/* Leaderboard and Team section - Stack on mobile, side by side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <LeaderboardCard />
        <TeamMembers />
      </div>

      {/* Points History */}
      <PointsHistory />
    </div>
  );
};

export default Dashboard;
