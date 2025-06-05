
import React from "react";
import { Outlet, Navigate } from "react-router-dom";
import { LoadingSpinner } from "@/components/dashboard/LoadingSpinner";
import { useAuth } from "@/context/AuthContext";
import { usePlatformAuth } from "@/hooks/usePlatformAuth";
import { PlatformSidebar } from "@/components/platform/PlatformSidebar";
import { MemoizedHeader } from "@/components/dashboard/MemoizedHeader";

const PlatformAdminLayout = () => {
  const { user, userName, isLoading, signOut } = useAuth();
  const { isPlatformAdmin, isPlatformAdminLoading } = usePlatformAuth();
  
  // Show loading spinner while checking authentication and platform admin status
  if (isLoading || isPlatformAdminLoading) {
    return <LoadingSpinner />;
  }
  
  // If no user, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // If not a platform admin, redirect to appropriate dashboard
  if (!isPlatformAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return (
    <div className="flex h-screen w-full bg-[#f7f8fa]">
      {/* Left Sidebar */}
      <PlatformSidebar 
        user={user}
        handleLogout={signOut}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <MemoizedHeader displayName={`${userName} (Platform Admin)`} />
        
        {/* Content Area */}
        <main className="flex-1 overflow-auto p-6 w-full transition-all duration-200 ease-in-out">
          <div className="animate-in fade-in-50 duration-200">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default PlatformAdminLayout;
