
import React from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { Header } from "@/components/dashboard/Header";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { LoadingSpinner } from "@/components/dashboard/LoadingSpinner";

const AdminLayout = () => {
  const { 
    user, 
    companyName, 
    userName, 
    firstName, 
    lastName, 
    isLoading, 
    signOut
  } = useAuth();
  const location = useLocation();
  
  // If loading, show the loading spinner
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  return (
    <div className="flex h-screen bg-[#f7f8fa]">
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
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
