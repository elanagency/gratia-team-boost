
import React from "react";
import { Outlet, Navigate } from "react-router-dom";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { LoadingSpinner } from "@/components/dashboard/LoadingSpinner";
import { useAuth } from "@/context/AuthContext";

// This file is deprecated - using DashboardLayout.tsx instead
const AdminLayout = () => {
  const { user, firstName, lastName, userName, isLoading, signOut } = useAuth();
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return (
    <div className="flex h-screen w-full bg-gray-50">
      <Sidebar 
        user={user}
        firstName={firstName}
        lastName={lastName}
        handleLogout={signOut}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header displayName={userName} />
        
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
