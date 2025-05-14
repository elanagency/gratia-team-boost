
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
          // Count team members in the same company
          const { count } = await supabase
            .from('company_members')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', companyMember.company_id);
          
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
    <div className="space-y-6">
      {/* Header with Give Points button */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-3">
          <div className="bg-gray-100 px-3 py-1.5 rounded-md flex items-center">
            <span className="text-sm font-medium text-gray-700 mr-1">Company Balance:</span>
            <span className="text-sm font-semibold">{isLoading ? "..." : companyPoints} points</span>
          </div>
          <GivePointsDialog />
        </div>
      </div>
      
      {/* Stats Grid */}
      <DashboardStats teamCount={teamCount} isLoading={isLoading} />

      {/* Leaderboard */}
      <LeaderboardCard />

      {/* Team section */}
      <TeamMembers />

      {/* Points History */}
      <PointsHistory />
    </div>
  );
};

export default Dashboard;
