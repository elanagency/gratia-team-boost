
import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, Link } from "react-router-dom";
import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger, SidebarHeader, SidebarFooter } from "@/components/ui/sidebar";
import { BarChart3, Users, Award, Gift, CreditCard, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AdminLayout = () => {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }
      setUser(session.user);
    };

    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        navigate("/login");
      } else if (session) {
        setUser(session.user);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  // Menu items for sidebar
  const menuItems = [
    { name: "Dashboard", icon: BarChart3, path: "/admin" },
    { name: "Team Management", icon: Users, path: "/admin/team" },
    { name: "Recognition History", icon: Award, path: "/admin/recognition" },
    { name: "Rewards Catalog", icon: Gift, path: "/admin/rewards" },
    { name: "Billing & Plan", icon: CreditCard, path: "/admin/billing" },
    { name: "Settings", icon: Settings, path: "/admin/settings" },
  ];

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-black">
        <Sidebar>
          <SidebarHeader className="p-4 border-b border-gray-800">
            <div className="flex items-center">
              <img 
                src="/lovable-uploads/9b86fd8b-fc4f-4456-8dcb-4970ae47f7f5.png" 
                alt="Grattia Logo" 
                className="h-8 w-auto" 
              />
            </div>
          </SidebarHeader>
          
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Main Navigation</SidebarGroupLabel>
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild tooltip={item.name}>
                      <Link to={item.path} className="flex items-center">
                        <item.icon className="mr-2" />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          
          <SidebarFooter>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-gray-400 hover:text-white"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log Out</span>
            </Button>
          </SidebarFooter>
        </Sidebar>
        
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex items-center h-16 px-6 border-b border-gray-800">
            <SidebarTrigger className="text-gray-400" />
            <div className="ml-4">
              <h1 className="text-xl font-semibold text-white">Admin Portal</h1>
            </div>
          </div>
          
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-1440 mx-auto px-5">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
