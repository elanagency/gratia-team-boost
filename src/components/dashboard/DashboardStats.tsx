
import React from "react";
import { Card } from "@/components/ui/card";
import { Users, Award, Gift, TrendingUp } from "lucide-react";

type StatItem = {
  title: string;
  value: string;
  icon: React.ElementType;
  description: string;
};

type DashboardStatsProps = {
  teamCount: number;
  isLoading: boolean;
};

export const DashboardStats = ({ teamCount, isLoading }: DashboardStatsProps) => {
  // Sample stats for the dashboard
  const stats: StatItem[] = [
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

  return (
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
  );
};
