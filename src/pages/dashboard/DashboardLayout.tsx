
import React, { useEffect, useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { LoadingSpinner } from "@/components/dashboard/LoadingSpinner";
import { useAuth } from "@/context/AuthContext";

const DashboardLayout = () => {
  const { 
    user, 
    firstName, 
    lastName, 
    userName, 
    isLoading, 
    signOut,
    isAdmin
  } = useAuth();
  
  // Add state to track if we've already attempted a redirect
  const [redirectAttempted, setRedirectAttempted] = useState(false);
  
  useEffect(() => {
    // Debug logging
    if (user) {
      console.log("DashboardLayout - User authenticated:", user.email);
      console.log("User is admin:", isAdmin);
    }
    
    // Set redirect attempted to true once we have the user and admin status
    if (user !== null && !redirectAttempted) {
      setRedirectAttempted(true);
    }
  }, [user, isAdmin, redirectAttempted]);
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  // If no user, redirect to login
  if (!user) {
    console.log("No user found, redirecting to login");
    return <Navigate to="/login" replace />;
  }
  
  // Only redirect to team dashboard if we have confirmed the user is not an admin
  // and we've already attempted to determine their status
  if (!isAdmin && redirectAttempted) {
    console.log("User is not an admin, redirecting to team dashboard");
    return <Navigate to="/dashboard-team" replace />;
  }
  
  return (
    <div className="flex h-screen w-full bg-[#f7f8fa]">
      {/* Left Sidebar */}
      <Sidebar 
        user={user}
        firstName={firstName}
        lastName={lastName}
        handleLogout={signOut}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <Header displayName={userName} />
        
        {/* Content Area with Scrolling */}
        <main className="flex-1 overflow-auto p-6 w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
