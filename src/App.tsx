
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Index from "./pages/Index";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import DashboardLayout from "./pages/dashboard/DashboardLayout";
import Dashboard from "./pages/admin/Dashboard";
import TeamManagement from "./pages/admin/TeamManagement";
import RecognitionHistory from "./pages/admin/RecognitionHistory";
import RewardsCatalog from "./pages/admin/RewardsCatalog";
import Billing from "./pages/admin/Billing";
import Settings from "./pages/admin/Settings";
import ProfileSettings from "./pages/admin/ProfileSettings";

// Import Team Dashboard components
import TeamDashboardLayout from "./pages/team/TeamDashboardLayout";
import TeamDashboard from "./pages/team/TeamDashboard";
import TeamRecognition from "./pages/team/TeamRecognition";
import RewardShop from "./pages/team/RewardShop";

// Create a client with better caching defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Data remains fresh for 5 minutes
      cacheTime: 1000 * 60 * 30, // Unused data is garbage collected after 30 minutes
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
  const isDashboard = 
    location.pathname.startsWith('/dashboard') || 
    location.pathname.startsWith('/dashboard-team');
  
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
              
              {/* Add redirect from old admin routes to new dashboard routes */}
              <Route path="/admin" element={<Navigate to="/dashboard" replace />} />
              <Route path="/admin/*" element={<Navigate to="/dashboard" replace />} />
              
              {/* Dashboard routes for administrators */}
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="team" element={<TeamManagement />} />
                <Route path="recognition" element={<RecognitionHistory />} />
                <Route path="rewards" element={<RewardsCatalog />} />
                <Route path="billing" element={<Billing />} />
                <Route path="settings" element={<Settings />} />
                <Route path="profile" element={<ProfileSettings />} />
              </Route>
              
              {/* Team Dashboard routes for regular team members */}
              <Route path="/dashboard-team" element={<TeamDashboardLayout />}>
                <Route index element={<TeamDashboard />} />
                <Route path="recognition" element={<TeamRecognition />} />
                <Route path="rewards" element={<RewardShop />} />
                <Route path="profile" element={<ProfileSettings />} />
              </Route>
              
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
