import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Index from "./pages/Index";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import UnifiedDashboardLayout from "./pages/dashboard/UnifiedDashboardLayout";
import Dashboard from "./pages/admin/Dashboard";
import TeamManagement from "./pages/admin/TeamManagement";

import GiftCardsCatalog from "./pages/admin/GiftCardsCatalog";

import Settings from "./pages/admin/Settings";
import ProfileSettings from "./pages/admin/ProfileSettings";

import GiftCardShop from "./pages/team/GiftCardShop";

// Import Platform Admin components
import PlatformAdminLayout from "./pages/platform/PlatformAdminLayout";
import PlatformDashboard from "./pages/platform/PlatformDashboard";
import CompaniesManagement from "./pages/platform/CompaniesManagement";
import PlatformGiftCardsCatalog from "./pages/platform/PlatformGiftCardsCatalog";
import TransactionsOverview from "./pages/platform/TransactionsOverview";
import PlatformSettings from "./pages/platform/PlatformSettings";
import SubscriptionMigration from "./pages/platform/SubscriptionMigration";

// Create a client with better caching defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Data remains fresh for 5 minutes
      gcTime: 1000 * 60 * 30, // Unused data is garbage collected after 30 minutes (renamed from cacheTime)
      refetchOnWindowFocus: true, // Refetch when window regains focus
      refetchOnMount: true, // Refetch when component mounts if data is stale
      retry: 1, // Retry failed queries once
    },
  },
});

// Wrapper component to add appropriate classes based on the route
const RouteClassWrapper = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  
  // Determine if this is a dashboard route
  const isDashboard = location.pathname.startsWith('/dashboard');
  
  // Apply the appropriate class to the body
  return (
    <div className={isDashboard ? "dashboard-layout" : "landing-page-container"}>
      {children}
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route element={<RouteClassWrapper><Outlet /></RouteClassWrapper>}>
              <Route path="/" element={<Index />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              
              {/* Add redirect from old admin routes to new dashboard routes */}
              <Route path="/admin" element={<Navigate to="/dashboard" replace />} />
              <Route path="/admin/*" element={<Navigate to="/dashboard" replace />} />
              
              {/* Platform Admin routes for platform owners */}
              <Route path="/platform-admin" element={<PlatformAdminLayout />}>
                <Route index element={<PlatformDashboard />} />
                <Route path="companies" element={<CompaniesManagement />} />
                <Route path="gift-cards" element={<PlatformGiftCardsCatalog />} />
                <Route path="transactions" element={<TransactionsOverview />} />
                <Route path="settings" element={<PlatformSettings />} />
                <Route path="migration" element={<SubscriptionMigration />} />
              </Route>
              
              {/* Unified Dashboard routes for all users */}
              <Route path="/dashboard" element={<UnifiedDashboardLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="team" element={<TeamManagement />} />
                <Route path="gift-cards" element={<GiftCardShop />} />
                <Route path="billing" element={<Navigate to="/dashboard/settings" replace />} />
                <Route path="settings" element={<Settings />} />
                <Route path="profile" element={<ProfileSettings />} />
              </Route>
              
              {/* Redirect old team dashboard routes to unified dashboard */}
              <Route path="/dashboard-team" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard-team/*" element={<Navigate to="/dashboard" replace />} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
