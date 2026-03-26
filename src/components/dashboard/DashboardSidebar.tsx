import React, { useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, BarChart3, Trophy, Gift, Settings, LogOut, Camera, Sparkles, Menu } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { GivePointsDialog } from "@/components/points/GivePointsDialog";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

type DashboardSidebarProps = {
  user: any;
  firstName: string;
  lastName: string;
  handleLogout: () => Promise<void>;
  isAdmin: boolean;
  avatarUrl?: string | null;
};

export const DashboardSidebar = ({
  user,
  firstName,
  lastName,
  handleLogout,
  isAdmin,
  avatarUrl,
}: DashboardSidebarProps) => {
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { companyId, companyName, role } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: memberCount } = useQuery({
    queryKey: ["company-member-count", companyId],
    queryFn: async () => {
      if (!companyId) return 0;
      const { count } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId)
        .eq("status", "active");
      return count ?? 0;
    },
    enabled: !!companyId,
  });

  const { data: company } = useQuery({
    queryKey: ["company-sidebar", companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const { data } = await supabase
        .from("companies")
        .select("name, logo_url")
        .eq("id", companyId)
        .single();
      return data;
    },
    enabled: !!companyId,
  });

  const menuItems = [
    { name: "Home", icon: Home, path: "/dashboard" },
    ...(isAdmin
      ? [{ name: "Analytics", icon: BarChart3, path: "/dashboard/analytics" }]
      : []),
    { name: "Redeem Points", icon: Gift, path: "/dashboard/gift-cards" },
    ...(isAdmin
      ? [{ name: "Settings", icon: Settings, path: "/dashboard/settings" }]
      : []),
  ];

  const isActive = (path: string) => location.pathname === path;

  const displayName = firstName
    ? `${firstName} ${lastName || ""}`
    : user?.email || "User";
  const initials = firstName
    ? firstName.charAt(0)
    : user?.email?.charAt(0).toUpperCase() || "U";
  const roleLabel = isAdmin ? "Admin" : "Member";

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filePath = `${user.id}/avatar.${ext}`;
    try {
      const { data: existingFiles } = await supabase.storage
        .from("avatars")
        .list(user.id);
      if (existingFiles?.length) {
        await supabase.storage
          .from("avatars")
          .remove(existingFiles.map((f) => `${user.id}/${f.name}`));
      }
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const avatarUrlWithCacheBust = `${publicUrl}?t=${Date.now()}`;
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrlWithCacheBust })
        .eq("id", user.id);
      if (updateError) throw updateError;
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      toast.success("Profile photo updated!");
    } catch (error) {
      console.error("Avatar upload error:", error);
      toast.error("Failed to upload photo");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="px-5 pt-6 pb-4">
        <Link to="/dashboard" onClick={() => setMobileOpen(false)}>
          <img
            src="/lovable-uploads/9b86fd8b-fc4f-4456-8dcb-4970ae47f7f5.png"
            alt="Grattia Logo"
            className="h-8 w-auto"
          />
        </Link>
      </div>

      {/* Company card */}
      <div className="mx-4 mb-4 p-3 rounded-lg bg-white/5">
        <div className="flex items-center gap-3">
          {company?.logo_url ? (
            <img
              src={company.logo_url}
              alt={company.name}
              className="h-9 w-9 rounded-lg object-cover"
            />
          ) : (
            <div className="h-9 w-9 rounded-lg bg-white/10 flex items-center justify-center text-sm font-semibold">
              {(company?.name || companyName || "C").charAt(0)}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">
              {company?.name || companyName || "Company"}
            </p>
            <p className="text-xs text-white/60">
              {memberCount ?? "–"} teammate{memberCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Give Recognition button */}
      <div className="px-4 mb-5">
        <GivePointsDialog
          trigger={
            <Button className="w-full h-10 rounded-lg font-semibold text-sm text-white bg-gradient-to-r from-[hsl(264,99%,58%)] to-[hsl(302,100%,67%)] hover:opacity-90 transition-opacity border-0">
              <Sparkles className="h-4 w-4 mr-2" />
              Give Recognition
            </Button>
          }
        />
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 space-y-1">
        {menuItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive(item.path)
                ? "bg-white/10 text-white"
                : "text-white/70 hover:text-white hover:bg-white/5"
            }`}
          >
            <item.icon className="h-[18px] w-[18px]" />
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-white/10 p-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleAvatarUpload}
        />
        <div className="flex items-center gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="relative group flex-shrink-0"
          >
            <Avatar className="h-9 w-9">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
              <AvatarFallback className="bg-white/20 text-white text-sm font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Camera className="h-3.5 w-3.5 text-white" />
            </div>
          </button>
          <div className="min-w-0 flex-1">
            <Link
              to="/dashboard/profile"
              onClick={() => setMobileOpen(false)}
              className="text-sm font-medium text-white truncate block hover:underline"
            >
              {displayName}
            </Link>
            <p className="text-xs text-white/60">{roleLabel}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-white/60 hover:text-white transition-colors p-1"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-[260px] flex-shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile trigger + sheet */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-sidebar flex items-center px-4 gap-3">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <button className="text-white p-1">
              <Menu className="h-6 w-6" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[280px] border-0 bg-sidebar">
            {sidebarContent}
          </SheetContent>
        </Sheet>
        <Link to="/dashboard">
          <img
            src="/lovable-uploads/9b86fd8b-fc4f-4456-8dcb-4970ae47f7f5.png"
            alt="Grattia Logo"
            className="h-7 w-auto"
          />
        </Link>
      </div>
    </>
  );
};
