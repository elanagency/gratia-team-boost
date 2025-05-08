
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users, Award, Gift, TrendingUp } from "lucide-react";

const Dashboard = () => {
  // Sample stats for the dashboard
  const stats = [
    { title: "Team Members", value: "12", icon: Users, description: "Active members" },
    { title: "Recognitions", value: "48", icon: Award, description: "This month" },
    { title: "Rewards Claimed", value: "7", icon: Gift, description: "This month" },
    { title: "Engagement", value: "92%", icon: TrendingUp, description: "Team activity" }
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="border-gray-800 bg-gray-900 text-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">{stat.title}</CardTitle>
              <stat.icon className="h-5 w-5 text-[#F572FF]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-gray-400 mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-gray-800 bg-gray-900 text-white">
          <CardHeader>
            <CardTitle className="text-[#F572FF]">Recent Recognitions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-400">
              <p>No recognitions yet</p>
              <p className="text-sm mt-2">Recognition activity will appear here</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-gray-800 bg-gray-900 text-white">
          <CardHeader>
            <CardTitle className="text-[#F572FF]">Top Performers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-400">
              <p>No team members yet</p>
              <p className="text-sm mt-2">Add team members to see performers</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
