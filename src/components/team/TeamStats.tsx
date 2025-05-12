
import React from "react";
import { Card } from "@/components/ui/card";
import { Award, Gift, Star } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

type StatItem = {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description: string;
};

export const TeamStats = () => {
  const { user, userName } = useAuth();
  
  // Sample stats for the team member dashboard
  const stats: StatItem[] = [
    { 
      title: "Your Points", 
      value: "320", // In a real app, this would come from your user data
      icon: Star, 
      description: "Available to spend" 
    },
    { 
      title: "Recognitions", 
      value: "12", 
      icon: Award, 
      description: "Received this month" 
    },
    { 
      title: "Rewards", 
      value: "3", 
      icon: Gift, 
      description: "Redeemed this year" 
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Welcome, {userName || 'Team Member'} 👋</h1>
      <p className="text-gray-500">Check your stats and redeem your points for rewards!</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
    </div>
  );
};
