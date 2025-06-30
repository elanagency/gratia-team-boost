
import React, { memo } from "react";
import { Link, useLocation } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { 
  BarChart3, 
  Building2, 
  CreditCard, 
  Settings, 
  LogOut,
  Shield,
  Gift
} from "lucide-react";

interface PlatformSidebarProps {
  user: User;
  handleLogout: () => void;
}

const navigation = [
  { name: 'Dashboard', href: '/platform-admin', icon: BarChart3 },
  { name: 'Companies', href: '/platform-admin/companies', icon: Building2 },
  { name: 'Rewards Catalog', href: '/platform-admin/rewards', icon: Gift },
  { name: 'Transactions', href: '/platform-admin/transactions', icon: CreditCard },
  { name: 'Settings', href: '/platform-admin/settings', icon: Settings },
];

export const PlatformSidebar = memo(({ user, handleLogout }: PlatformSidebarProps) => {
  const location = useLocation();

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-[#F572FF]" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">Platform Admin</h1>
            <p className="text-sm text-gray-500">Control Center</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href || 
                          (item.href !== '/platform-admin' && location.pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[#F572FF] text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 bg-[#F572FF] rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {user.email?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">Platform Admin</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );
});

PlatformSidebar.displayName = 'PlatformSidebar';
