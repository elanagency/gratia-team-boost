
import React, { useEffect } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { MemoizedSidebar } from "@/components/dashboard/MemoizedSidebar";
import { MemoizedHeader } from "@/components/dashboard/MemoizedHeader";
import { LoadingSpinner } from "@/components/dashboard/LoadingSpinner";
import { useAuth } from "@/context/AuthContext";

const TeamDashboardLayout = () => {
  const { 
    user, 
    firstName, 
    lastName, 
    userName, 
    isLoading,
    isAdminLoading,
    signOut,
    isAdmin
  } = useAuth();
  
  useEffect(() => {
    if (user) {
      console.log("TeamDashboardLayout - User authenticated:", user.email);
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
  
  // If user is admin and we're not loading admin status, redirect to admin dashboard
  if (isAdmin && !isAdminLoading) {
    console.log("User is admin, redirecting to admin dashboard");
    return <Navigate to="/dashboard" replace />;
  }
  
  return (
    <div className="flex h-screen w-full bg-[#f7f8fa]">
      {/* Left Sidebar - Memoized */}
      <MemoizedSidebar 
        user={user}
        firstName={firstName}
        lastName={lastName}
        handleLogout={signOut}
        isTeamView={true}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header - Memoized */}
        <MemoizedHeader displayName={userName} isTeamView={true} />
        
        {/* Content Area with Scrolling and Transition */}
        <main className="flex-1 overflow-auto p-6 w-full transition-all duration-200 ease-in-out">
          <div className="animate-in fade-in-50 duration-200">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default TeamDashboardLayout;
