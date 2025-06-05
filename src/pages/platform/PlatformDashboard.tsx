
import React from "react";
import { PlatformStatsCards } from "@/components/platform/PlatformStatsCards";
import { RecentActivity } from "@/components/platform/RecentActivity";
import { PlatformAnalytics } from "@/components/platform/PlatformAnalytics";

const PlatformDashboard = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Dashboard</h1>
          <p className="text-gray-600">Overview of all platform activity</p>
        </div>
      </div>
      
      {/* Stats Cards */}
      <PlatformStatsCards />

      {/* Charts and Analytics */}
      <PlatformAnalytics />

      {/* Recent Activity */}
      <RecentActivity />
    </div>
  );
};

export default PlatformDashboard;
