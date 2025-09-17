import React, { useEffect } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { LoadingSpinner } from "@/components/dashboard/LoadingSpinner";
import { useAuth } from "@/context/AuthContext";

import { DashboardTopNavigation } from "@/components/dashboard/DashboardTopNavigation";

const UnifiedDashboardLayout = () => {
  const { 
    user, 
    firstName, 
    lastName, 
    isLoading,
    isAdminLoading,
    signOut,
    isAdmin,
    isPlatformAdmin
  } = useAuth();
  
  useEffect(() => {
    if (user) {
      console.log("UnifiedDashboardLayout - User authenticated:", user.email);
      console.log("User is admin:", isAdmin);
      console.log("Admin loading status:", isAdminLoading);
    }
  }, [user, isAdmin, isAdminLoading]);
  
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