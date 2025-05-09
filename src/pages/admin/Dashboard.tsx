
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GivePointsDialog } from "@/components/points/GivePointsDialog";
import { PointsHistory } from "@/components/points/PointsHistory";
import { LeaderboardCard } from "@/components/points/LeaderboardCard";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { DashboardTasks } from "@/components/dashboard/DashboardTasks";
import { TeamMembers } from "@/components/dashboard/TeamMembers";
import { EventsCalendar } from "@/components/dashboard/EventsCalendar";

const Dashboard = () => {
  const [teamCount, setTeamCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Load team member count from database
  useEffect(() => {
    const loadTeamData = async () => {
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
          
          if (count !== null) {
            setTeamCount(count);
          }
        }
      } catch (error) {
        console.error("Error loading team data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTeamData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header with Give Points button */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <GivePointsDialog />
      </div>
      
      {/* Stats Grid */}
      <DashboardStats teamCount={teamCount} isLoading={isLoading} />

      {/* Leaderboard */}
      <LeaderboardCard />

      {/* Tasks and Team Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Things to do */}
        <div className="lg:col-span-2">
          <DashboardTasks />
        </div>
        
        {/* Team section */}
        <div>
          <TeamMembers />
        </div>
      </div>

      {/* Points History */}
      <PointsHistory />

      {/* Calendar / Upcoming Events */}
      <EventsCalendar />
    </div>
  );
};

export default Dashboard;
