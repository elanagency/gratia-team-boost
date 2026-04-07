import React, { useEffect, useRef } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { LoadingSpinner } from "@/components/dashboard/LoadingSpinner";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay } from "date-fns";
import { PersonalStatsCard } from "@/components/dashboard/PersonalStatsCard";
import { LeaderboardCard } from "@/components/points/LeaderboardCard";
import { UpcomingCelebrations } from "@/components/dashboard/UpcomingCelebrations";

const UnifiedDashboardLayout = () => {
  const { 
    user, 
    firstName, 
    lastName, 
    isLoading,
    isAdminLoading,
    signOut,
    isAdmin,
    isPlatformAdmin,
    status,
    companyId,
    avatarUrl
  } = useAuth();
  const sessionTrackedRef = useRef(false);
  
  useEffect(() => {
    if (user) {
      console.log("UnifiedDashboardLayout - User authenticated:", user.email);
      console.log("User is admin:", isAdmin);
      console.log("Admin loading status:", isAdminLoading);
    }
  }, [user, isAdmin, isAdminLoading]);
  
  // Check for deactivated status and block access
  useEffect(() => {
    if (user && !isLoading && !isAdminLoading && status === 'deactivated') {
      console.log("Deactivated user detected in dashboard, signing out");
      toast.error("Your account has been deactivated. Please contact your administrator.");
      signOut();
    }
  }, [user, isLoading, isAdminLoading, status, signOut]);

  // Track daily active user session (once per day per user)
  useEffect(() => {
    if (!user || !companyId || status === 'deactivated' || sessionTrackedRef.current) return;
    sessionTrackedRef.current = true;

    const trackSession = async () => {
      try {
        const todayStart = startOfDay(new Date()).toISOString();
        const { data } = await supabase
          .from('login_events')
          .select('id')
          .eq('user_id', user.id)
          .eq('company_id', companyId)
          .gte('logged_in_at', todayStart)
          .limit(1);

        if (!data || data.length === 0) {
          await supabase.from('login_events').insert({ user_id: user.id, company_id: companyId });
        }
      } catch (err) {
        console.error('Daily session tracking error:', err);
      }
    };

    trackSession();
  }, [user, companyId, status]);
  
  // Show loading spinner if either main loading or admin status is loading
  if (isLoading || isAdminLoading) {
    return <LoadingSpinner />;
  }
  
  // If no user, redirect to login
  if (!user) {
    console.log("No user found, redirecting to login");
    return <Navigate to="/login" replace />;
  }
  
  // If user is platform admin, redirect to platform admin dashboard
  if (isPlatformAdmin) {
    console.log("Platform admin detected, redirecting to platform admin dashboard");
    return <Navigate to="/platform-admin" replace />;
  }
  
  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <DashboardSidebar
        user={user}
        firstName={firstName}
        lastName={lastName}
        handleLogout={signOut}
        isAdmin={isAdmin}
        avatarUrl={avatarUrl}
      />

      {/* Main Content + Right Panel */}
      <main className="flex-1 min-w-0 lg:pr-[350px]">
        {/* Scrollable Center Area */}
        <div className="flex-1 min-w-0 p-4 pt-16 lg:px-[60px] lg:pt-[72px] overflow-y-auto">
          <div className="animate-in fade-in-50 duration-200">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Right Panel - Fixed Sidebar */}
      <aside className="hidden lg:flex flex-col fixed right-0 top-0 w-[350px] h-screen border-l border-[#E8E6F0] overflow-y-auto p-4 pt-[72px] gap-6 bg-background z-30">
        <PersonalStatsCard />
        <LeaderboardCard />
        <UpcomingCelebrations />
      </aside>
    </div>
  );
};

export default UnifiedDashboardLayout;