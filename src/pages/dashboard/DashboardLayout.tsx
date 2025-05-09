
import React from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { LoadingSpinner } from "@/components/dashboard/LoadingSpinner";
import { useAuth } from "@/hooks/useAuth";

const DashboardLayout = () => {
  const { 
    user, 
    firstName, 
    lastName, 
    isLoading, 
    handleLogout 
  } = useAuth();
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  // Display name to show in header salutation
  const displayName = firstName ? `${firstName} ${lastName || ''}` : (user?.email || "User");
  
  return (
    <div className="flex h-screen bg-[#f7f8fa]">
      {/* Left Sidebar */}
      <Sidebar 
        user={user}
        firstName={firstName}
        lastName={lastName}
        handleLogout={handleLogout}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <Header displayName={displayName} />
        
        {/* Content Area with Scrolling */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
