
import React, { useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { LoadingSpinner } from "@/components/dashboard/LoadingSpinner";
import { useAuth } from "@/context/AuthContext";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import { PlatformSidebar } from "@/components/platform/PlatformSidebar";
import { MemoizedHeader } from "@/components/dashboard/MemoizedHeader";

const PlatformAdminLayout = () => {
  const { user, userName, isLoading, signOut, isPlatformAdmin } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Show loading spinner while checking authentication
  if (isLoading) {
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
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden lg:flex">
        <PlatformSidebar 
          user={user}
          handleLogout={signOut}
        />
      </div>

      {/* Mobile Menu */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <PlatformSidebar 
            user={user}
            handleLogout={signOut}
          />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Mobile menu button */}
            <div className="flex items-center gap-4">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="lg:hidden"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
              </Sheet>
              
              {/* Desktop title */}
              <h2 className="hidden lg:block text-lg font-semibold text-gray-900">
                {`${userName} (Platform Admin)`}
              </h2>
              
              {/* Mobile title */}
              <h2 className="lg:hidden text-base font-semibold text-gray-900">
                Platform Admin
              </h2>
            </div>
          </div>
        </div>
        
        {/* Content Area */}
        <main className="flex-1 overflow-auto p-4 lg:p-6 w-full transition-all duration-200 ease-in-out">
          <div className="animate-in fade-in-50 duration-200">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default PlatformAdminLayout;
