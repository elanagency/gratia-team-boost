import React, { useEffect, useRef } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { LoadingSpinner } from "@/components/dashboard/LoadingSpinner";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { DashboardTopNavigation } from "@/components/dashboard/DashboardTopNavigation";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay } from "date-fns";

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
    <div className="min-h-screen bg-[#f7f8fa]">
      {/* Top Navigation */}
      <DashboardTopNavigation 
        user={user}
        firstName={firstName}
        lastName={lastName}
        handleLogout={signOut}
        isAdmin={isAdmin}
        avatarUrl={avatarUrl}
      />
      
      {/* Main Content */}
      <main className="p-4 lg:p-6 w-full transition-all duration-200 ease-in-out">
        <div className="animate-in fade-in-50 duration-200">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default UnifiedDashboardLayout;