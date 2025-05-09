import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Users, Award, Gift, TrendingUp, ChevronRight, Calendar, FileCheck, CreditCard, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GivePointsDialog } from "@/components/points/GivePointsDialog";
import { PointsHistory } from "@/components/points/PointsHistory";
import { LeaderboardCard } from "@/components/points/LeaderboardCard";

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

  // Sample stats for the dashboard
  const stats = [
    { 
      title: "Team Members", 
      value: isLoading ? "..." : teamCount.toString(), 
      icon: Users, 
      description: "Active members" 
    },
    { 
      title: "Recognitions", 
      value: "48", 
      icon: Award, 
      description: "This month" 
    },
    { 
      title: "Rewards Claimed", 
      value: "7", 
      icon: Gift, 
      description: "This month" 
    },
    { 
      title: "Engagement", 
      value: "92%", 
      icon: TrendingUp, 
      description: "Team activity" 
    }
  ];

  // Sample tasks for the dashboard
  const tasks = [
    { 
      id: 1,
      title: "Review recognition requests",
      description: "3 requests need your attention",
      icon: Award,
      iconBg: "#ffedd5",
      iconColor: "#f59e0b",
      date: "Today"
    },
    { 
      id: 2,
      title: "Process reward claims",
      description: "You have 2 pending reward claims to review",
      icon: Gift,
      iconBg: "#e0e7ff",
      iconColor: "#6366f1",
      date: "Today"
    },
    { 
      id: 3,
      title: "Upload team photos",
      description: "Add photos from the recent team event",
      icon: FileCheck,
      iconBg: "#dcfce7",
      iconColor: "#10b981",
      date: "Today"
    },
    { 
      id: 4,
      title: "Set up payment method",
      description: "Complete your billing information",
      icon: CreditCard,
      iconBg: "#fae8ff",
      iconColor: "#F572FF",
      date: "Yesterday"
    }
  ];

  // Sample team members - will fetch actual data in the future
  const teamMembers = [
    { id: 1, name: "Mike Johnson", role: "Developer", country: "United States" },
    { id: 2, name: "Sarah Chen", role: "Designer", country: "Singapore" },
    { id: 3, name: "Alex Patel", role: "Marketing", country: "India" }
  ];

  return (
    <div className="space-y-6">
      {/* Header with Give Points button */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <GivePointsDialog />
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="dashboard-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">{stat.title}</p>
                <h3 className="text-2xl font-semibold mt-1">{stat.value}</h3>
                <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
              </div>
              <div className={`h-12 w-12 rounded-full flex items-center justify-center bg-[#F572FF]/10`}>
                <stat.icon className="h-6 w-6 text-[#F572FF]" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Replace PointsHistory with Leaderboard */}
      <LeaderboardCard />

      {/* Tasks and Team Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Things to do */}
        <div className="lg:col-span-2">
          <Card className="dashboard-card h-full">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">Things to do</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {tasks.map((task) => (
                <div key={task.id} className="p-4 flex items-center gap-4">
                  <div 
                    className="h-10 w-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: task.iconBg }}
                  >
                    <task.icon style={{ color: task.iconColor }} size={18} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">{task.title}</h4>
                    <p className="text-sm text-gray-500">{task.description}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-gray-400">{task.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
        
        {/* Team section */}
        <div>
          <Card className="dashboard-card h-full">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">Your team</h2>
              <a href="#" className="text-sm text-[#F572FF] flex items-center">
                View All <ChevronRight size={16} />
              </a>
            </div>
            <div className="p-6 space-y-4">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                    {member.name.charAt(0)}
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-800">{member.name}</p>
                    <p className="text-xs text-gray-500">{member.role}</p>
                  </div>
                  <div className="ml-auto">
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">{member.country}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Points History - Move it below the leaderboard */}
      <PointsHistory />

      {/* Calendar / Upcoming Events */}
      <Card className="dashboard-card">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Upcoming events</h2>
          <a href="#" className="text-sm text-[#F572FF] flex items-center">
            View Calendar <ChevronRight size={16} />
          </a>
        </div>
        <div className="py-4 px-6">
          <div className="flex items-center p-4 bg-gray-50 rounded-lg">
            <div className="flex flex-col items-center justify-center w-16 h-16 bg-white rounded-lg shadow-sm border border-gray-100">
              <span className="text-sm text-gray-500">Nov</span>
              <span className="text-xl font-bold text-gray-800">15</span>
            </div>
            <div className="ml-4">
              <h3 className="font-medium text-gray-800">Team Recognition Event</h3>
              <p className="text-sm text-gray-500">Monthly recognition ceremony</p>
              <div className="mt-1 flex items-center">
                <Calendar size={14} className="text-gray-400 mr-1" />
                <span className="text-xs text-gray-500">10:00 AM - 11:00 AM</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
