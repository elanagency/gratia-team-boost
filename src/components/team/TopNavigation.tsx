import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Gift, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface TopNavigationProps {
  user: any;
  firstName: string;
  lastName: string;
  handleLogout: () => Promise<void>;
}

export const TopNavigation = ({ user, firstName, lastName, handleLogout }: TopNavigationProps) => {
  const location = useLocation();
  
  const menuItems = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard-team"
    },
    {
      name: "Rewards Shop",
      icon: Gift,
      path: "/dashboard-team/rewards"
    }
  ];
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  const displayName = firstName ? `${firstName} ${lastName || ''}` : (user?.email || "User");
  const initials = firstName ? firstName.charAt(0) : (user?.email?.charAt(0).toUpperCase() || "U");
  
  return (
    <nav className="bg-white border-b border-gray-200 px-4 lg:px-6 h-16 flex items-center justify-between">
      {/* Logo */}
      <div className="flex items-center">
        <Link to="/dashboard-team" className="flex items-center">
          <img 
            src="/lovable-uploads/9b86fd8b-fc4f-4456-8dcb-4970ae47f7f5.png" 
            alt="Grattia Logo" 
            className="h-8 w-auto"
          />
        </Link>
      </div>
      
      {/* Center Navigation */}
      <div className="flex items-center space-x-1">
        {menuItems.map(item => (
          <Link 
            key={item.name} 
            to={item.path}
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive(item.path)
                ? 'bg-primary/10 text-primary'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <item.icon className={`h-4 w-4 mr-2 ${
              isActive(item.path) ? 'text-primary' : 'text-gray-500'
            }`} />
            <span className="hidden sm:inline">{item.name}</span>
          </Link>
        ))}
      </div>
      
      {/* User Menu */}
      <div className="flex items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 rounded-full p-0">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="flex items-center justify-start gap-2 p-2">
              <div className="flex flex-col space-y-1 leading-none">
                <p className="font-medium text-sm">{displayName}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/dashboard-team/profile" className="w-full">
                Profile Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
};