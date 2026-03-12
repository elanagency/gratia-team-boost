import React, { useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Settings, User, LogOut, BarChart3, Camera } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { RedeemablePointsBox } from "@/components/navigation/RedeemablePointsBox";
import OnboardingProgressWidget from "@/components/onboarding/OnboardingProgressWidget";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

type DashboardTopNavigationProps = {
  user: any;
  firstName: string;
  lastName: string;
  handleLogout: () => Promise<void>;
  isAdmin: boolean;
  avatarUrl?: string | null;
}

export const DashboardTopNavigation = ({ user, firstName, lastName, handleLogout, isAdmin, avatarUrl }: DashboardTopNavigationProps) => {
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  
  const menuItems = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard"
    },
    ...(isAdmin ? [
      {
        name: "Analytics",
        icon: BarChart3,
        path: "/dashboard/analytics"
      }
    ] : [])
  ];
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  const displayName = firstName ? `${firstName} ${lastName || ''}` : (user?.email || "User");
  const initials = firstName ? firstName.charAt(0) : (user?.email?.charAt(0).toUpperCase() || "U");

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error("Image must be less than 5MB");
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filePath = `${user.id}/avatar.${ext}`;

    try {
      // Delete old avatar files first
      const { data: existingFiles } = await supabase.storage
        .from('avatars')
        .list(user.id);
      
      if (existingFiles?.length) {
        await supabase.storage
          .from('avatars')
          .remove(existingFiles.map(f => `${user.id}/${f.name}`));
      }

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Add cache-buster to URL
      const avatarUrlWithCacheBust = `${publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrlWithCacheBust })
        .eq('id', user.id);

      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      toast.success("Profile photo updated!");
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error("Failed to upload photo");
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  
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
      <div className="flex items-center gap-4 relative z-10">
        <Link to="/dashboard" className="flex items-center">
          <img 
            src="/lovable-uploads/9b86fd8b-fc4f-4456-8dcb-4970ae47f7f5.png" 
            alt="Grattia Logo" 
            className="h-8 w-auto"
          />
        </Link>
        {isAdmin && <OnboardingProgressWidget />}
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
      <div className="flex items-center gap-2 relative z-10">
        {isAdmin && (
          <Link
            to="/dashboard/settings"
            className="p-2 rounded-md hover:bg-white/10 transition-colors"
            title="Company Settings"
          >
            <Settings className="h-5 w-5 text-white" />
          </Link>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleAvatarUpload}
        />
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-white/10 transition-colors">
            <Avatar className="h-8 w-8">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
              <AvatarFallback className="bg-white/20 text-white font-medium text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-white">{displayName}</p>
              <p className="text-xs text-white/70">{user?.email}</p>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="flex items-center justify-start gap-2 p-2">
              <Avatar className="h-10 w-10">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
                <AvatarFallback className="bg-muted text-muted-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col space-y-1 leading-none">
                <p className="font-medium text-sm text-foreground">{displayName}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <DropdownMenuItem
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Camera className="h-4 w-4" />
              Change photo
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/dashboard/profile" className="flex items-center gap-2 cursor-pointer">
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
    </nav>
  );
};
