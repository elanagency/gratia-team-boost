
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Award, Gift, CreditCard, Settings, LogOut, UserCircle } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

type CollapsibleSidebarProps = {
  user: any;
  firstName: string;
  lastName: string;
  handleLogout: () => Promise<void>;
  isTeamView?: boolean;
}

export const CollapsibleSidebar = ({ user, firstName, lastName, handleLogout, isTeamView }: CollapsibleSidebarProps) => {
  const location = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  
  // Menu items for admin sidebar
  const adminMenuItems = [{
    name: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard"
  }, {
    name: "Recognition",
    icon: Award,
    path: "/dashboard/recognition"
  }, {
    name: "Rewards",
    icon: Gift,
    path: "/dashboard/rewards"
  }, {
    name: "Billing",
    icon: CreditCard,
    path: "/dashboard/billing"
  }, {
    name: "Settings",
    icon: Settings,
    path: "/dashboard/settings"
  }];

  // Menu items for team member sidebar
  const teamMenuItems = [{
    name: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard-team"
  }, {
    name: "Recognition",
    icon: Award,
    path: "/dashboard-team/recognition"
  }, {
    name: "Rewards Shop",
    icon: Gift,
    path: "/dashboard-team/rewards"
  }];
  
  // Select which menu items to display based on isTeamView
  const menuItems = isTeamView ? teamMenuItems : adminMenuItems;
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  // Display name to show in user profile
  const displayName = firstName ? `${firstName} ${lastName || ''}` : (user?.email || "User");
  
  return (
    <Sidebar className="dark-sidebar border-r-0">
      <SidebarHeader className="p-6 border-b border-white/10">
        <Link to={isTeamView ? "/dashboard-team" : "/dashboard"} className="flex items-center justify-center">
          <img 
            src="/lovable-uploads/9b86fd8b-fc4f-4456-8dcb-4970ae47f7f5.png" 
            alt="Grattia Logo" 
            className="h-8 w-auto" 
          />
        </Link>
      </SidebarHeader>
      
      <SidebarContent className="py-6">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map(item => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton asChild isActive={isActive(item.path)}>
                    <Link 
                      to={item.path} 
                      className={`
                        flex items-center gap-3 px-4 py-3 mx-auto rounded-md transition-colors w-full max-w-[calc(100%-1.5rem)]
                        ${isActive(item.path) 
                          ? 'bg-[#F572FF]/20 text-[#F572FF] border-l-2 border-[#F572FF]' 
                          : 'text-white hover:bg-white/10'
                        }
                      `}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!isCollapsed && <span className="truncate">{item.name}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-white/10 p-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#F572FF] rounded-full flex items-center justify-center text-white font-medium flex-shrink-0">
            {firstName ? firstName.charAt(0) : (user?.email?.charAt(0).toUpperCase() || "U")}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{displayName}</p>
              <div className="flex items-center justify-between">
                <p className="text-xs text-white/70 truncate">{user?.email}</p>
                <button 
                  onClick={handleLogout} 
                  className="ml-2 text-white/70 hover:text-white transition-colors"
                  title="Sign out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          )}
          {isCollapsed && (
            <button 
              onClick={handleLogout} 
              className="text-white/70 hover:text-white transition-colors"
              title="Sign out"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};
