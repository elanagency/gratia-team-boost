import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Award, Gift, CreditCard, Settings, LogOut } from "lucide-react";

type SidebarProps = {
  user: any;
  firstName: string;
  lastName: string;
  handleLogout: () => Promise<void>;
  isTeamView?: boolean;
}

export const Sidebar = ({ user, firstName, lastName, handleLogout, isTeamView }: SidebarProps) => {
  const location = useLocation();
  
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
    <div className="w-[320px] flex-shrink-0 dark-sidebar px-0">
      <div className="flex items-center p-4 border-white/10 my-[20px]">
        <Link to={isTeamView ? "/dashboard-team" : "/dashboard"} className="flex items-center">
          <img src="/lovable-uploads/9b86fd8b-fc4f-4456-8dcb-4970ae47f7f5.png" alt="Grattia Logo" className="h-8 w-auto mr-2" />
        </Link>
      </div>
      
      <nav className="py-4 flex flex-col h-[calc(100%-8rem)]">
        {/* Main menu items */}
        <div className="flex-1">
          {menuItems.map(item => (
            <Link 
              key={item.name} 
              to={item.path} 
              className={`dark-sidebar-nav-item ${isActive(item.path) ? 'active' : ''}`}
            >
              <item.icon className={`dark-sidebar-nav-item-icon ${isActive(item.path) ? 'text-[#F572FF]' : 'text-white'}`} />
              <span>{item.name}</span>
            </Link>
          ))}
        </div>
      </nav>

      <div className="absolute bottom-0 left-0 w-[320px] border-t border-white/10 p-4">
        <Link to={isTeamView ? "/dashboard-team/profile" : "/dashboard/profile"} className="flex items-center group hover:bg-white/5 p-2 rounded-md transition-colors">
          <div className="w-8 h-8 bg-[#F572FF] rounded-full flex items-center justify-center text-white font-medium">
            {firstName ? firstName.charAt(0) : (user?.email?.charAt(0).toUpperCase() || "U")}
          </div>
          <div className="ml-2 flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{displayName}</p>
            <p className="text-xs text-white/70 truncate group-hover:text-white/90 transition-colors">{user?.email}</p>
          </div>
          <button onClick={handleLogout} className="ml-2 text-white/70 hover:text-white">
            <LogOut size={18} />
          </button>
        </Link>
      </div>
    </div>
  );
};
