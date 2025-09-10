import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { RedeemablePointsBox } from "@/components/navigation/RedeemablePointsBox";

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
    }
  ];
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  const displayName = firstName ? `${firstName} ${lastName || ''}` : (user?.email || "User");
  const initials = firstName ? firstName.charAt(0) : (user?.email?.charAt(0).toUpperCase() || "U");
  
  return (
    <nav className="relative bg-gradient-to-r from-grattia-purple-dark via-grattia-purple to-grattia-purple-light border-b border-grattia-purple-light/20 px-4 lg:px-6 h-16 flex items-center justify-between overflow-hidden">
      {/* Background gradient effect */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-grattia-purple/30 via-transparent to-transparent"></div>
      </div>
      
      {/* Glowing orb effects */}
      <div className="absolute top-0 right-10 w-32 h-32 rounded-full bg-grattia-pink/10 blur-2xl"></div>
      <div className="absolute bottom-0 left-10 w-40 h-40 rounded-full bg-grattia-purple/20 blur-2xl"></div>
      {/* Logo */}
      <div className="flex items-center relative z-10">
        <Link to="/dashboard-team" className="flex items-center">
          <img 
            src="/lovable-uploads/9b86fd8b-fc4f-4456-8dcb-4970ae47f7f5.png" 
            alt="Grattia Logo" 
            className="h-8 w-auto"
          />
        </Link>
      </div>
      
      {/* Center Navigation */}
      <div className="flex items-center space-x-3 relative z-10">
        {menuItems.map(item => (
          <Link 
            key={item.name} 
            to={item.path}
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive(item.path)
                ? 'bg-white/20 text-white shadow-lg'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <item.icon className={`h-4 w-4 mr-2 ${
              isActive(item.path) ? 'text-white' : 'text-white/70'
            }`} />
            <span className="hidden sm:inline">{item.name}</span>
          </Link>
        ))}
        <RedeemablePointsBox />
      </div>
      
      {/* User Menu */}
      <div className="flex items-center relative z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 rounded-full p-0 hover:bg-white/10">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-grattia-pink text-white text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="flex items-center justify-start gap-2 p-2">
              <div className="flex flex-col space-y-1 leading-none">
                <p className="font-medium text-sm text-foreground">{displayName}</p>
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