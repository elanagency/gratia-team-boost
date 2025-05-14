
import React, { useEffect } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
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
    // Debug logging
    if (user) {
      console.log("TeamDashboardLayout - User authenticated:", user.email);
      console.log("User is admin:", isAdmin);
      console.log("Admin loading status:", isAdminLoading);
    }
    
    // Clear the redirect flag when we navigate to team dashboard
    return () => {
      sessionStorage.removeItem('redirected_from_team');
    };
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
  
  // Check if we've already redirected from admin dashboard to prevent loops
  const redirectedFromAdmin = sessionStorage.getItem('redirected_from_admin');
  
  // Only redirect to admin dashboard if we have confirmed the user is an admin
  // and we're no longer loading the admin status, and we haven't already redirected
  if (isAdmin && !isAdminLoading && !redirectedFromAdmin) {
    console.log("User is an admin, redirecting to admin dashboard");
    // Store in sessionStorage that we've redirected from the team dashboard
    sessionStorage.setItem('redirected_from_team', 'true');
    // Clear the admin redirect flag since we're leaving the page
    sessionStorage.removeItem('redirected_from_admin');
    return <Navigate to="/dashboard" replace />;
  }
  
  return (
    <div className="flex h-screen w-full bg-[#f7f8fa]">
      {/* Left Sidebar - Modified for team members */}
      <Sidebar 
        user={user}
        firstName={firstName}
        lastName={lastName}
        handleLogout={signOut}
        isTeamView={true} // Indicate this is the team view
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <Header displayName={userName} isTeamView={true} />
        
        {/* Content Area with Scrolling */}
        <main className="flex-1 overflow-auto p-6 w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default TeamDashboardLayout;
