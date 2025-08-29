import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Gift, Settings, User, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type AdminTopNavigationProps = {
  user: any;
  firstName: string;
  lastName: string;
  handleLogout: () => Promise<void>;
}

export const AdminTopNavigation = ({ user, firstName, lastName, handleLogout }: AdminTopNavigationProps) => {
  const location = useLocation();
  
  const menuItems = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard"
    },
    {
      name: "Rewards",
      icon: Gift,
      path: "/dashboard/rewards"
    },
    {
      name: "Settings",
      icon: Settings,
      path: "/dashboard/settings"
    }
  ];
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  const displayName = firstName ? `${firstName} ${lastName || ''}` : (user?.email || "User");
  
  return (
    <nav className="bg-gradient-to-r from-primary via-primary to-accent border-b border-border/40 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="px-4 lg:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center">
              <img 
                src="/lovable-uploads/9b86fd8b-fc4f-4456-8dcb-4970ae47f7f5.png" 
                alt="Grattia Logo" 
                className="h-8 w-auto"
              />
            </Link>
          </div>
          
          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? 'text-primary-foreground bg-white/20'
                    : 'text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            ))}
          </div>
          
          {/* User Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-white/10 transition-colors">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-primary-foreground font-medium">
                {firstName ? firstName.charAt(0) : (user?.email?.charAt(0).toUpperCase() || "U")}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-primary-foreground">{displayName}</p>
                <p className="text-xs text-primary-foreground/70">{user?.email}</p>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link to="/dashboard/profile" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Profile Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 text-destructive">
                <LogOut className="h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
};