
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
    signOut,
    isAdmin
  } = useAuth();
  
  useEffect(() => {
    // Debug logging
    if (user) {
      console.log("TeamDashboardLayout - User authenticated:", user.email);
      console.log("User is admin:", isAdmin);
    }
  }, [user, isAdmin]);
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  // If no user, redirect to login
  if (!user) {
    console.log("No user found, redirecting to login");
    return <Navigate to="/login" replace />;
  }
  
  // If user is an admin, redirect to admin dashboard
  if (isAdmin) {
    console.log("User is an admin, redirecting to admin dashboard");
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
