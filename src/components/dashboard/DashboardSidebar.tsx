import React, { useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, BarChart3, Gift, Settings, LogOut, Camera, Menu } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { GivePointsDialog } from "@/components/points/GivePointsDialog";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import grattiaLogo from "@/assets/grattia-logo-white.png";

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
  const { companyId, companyName } = useAuth();
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

  const giveRecognitionTrigger = (
    <button
      className="w-full py-[9.375px] rounded-[13.375px] text-white font-medium text-[14px] leading-[21px] bg-[#7F2BFE] hover:bg-[#6B22E0] transition-colors flex items-center justify-center"
    >
      Give Recognition
    </button>
  );

  const sidebarContent = (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground font-['Inter'] p-[15px]">
      {/* Logo - centered */}
      <div className="pb-[15px] flex justify-center">
        <Link to="/dashboard" onClick={() => setMobileOpen(false)}>
          <img
            src={grattiaLogo}
            alt="Grattia Logo"
            className="h-[26px] w-auto"
          />
        </Link>
      </div>

      {/* Company card */}
      <div className="mb-[15px] h-[55px] px-[11.25px] rounded-[13.375px] bg-white/5 flex items-center">
        <div className="flex items-center gap-[11.25px]">
          {company?.logo_url ? (
            <img
              src={company.logo_url}
              alt={company.name}
              className="h-9 w-9 rounded-lg object-cover"
            />
          ) : (
            <div className="h-9 w-9 rounded-lg bg-white/10 flex items-center justify-center text-[13px] font-medium">
              {(company?.name || companyName || "C").charAt(0)}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-white truncate">
              {company?.name || companyName || "Company"}
            </p>
            <p className="text-[11px] font-normal text-white/45">
              {memberCount ?? "–"} teammate{memberCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Give Recognition button */}
      <div className="mb-[22.5px]">
        <GivePointsDialog trigger={giveRecognitionTrigger} />
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-[11.25px] px-[11.25px] py-[7.5px] rounded-[13.375px] text-[14px] leading-[21px] transition-colors ${
              isActive(item.path)
                ? "bg-white/[0.06] text-white font-medium"
                : "text-white/70 font-normal hover:text-white hover:bg-white/[0.03]"
            }`}
          >
            <item.icon className="h-[18px] w-[18px]" />
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-white/10 pt-[15px]">
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
              className="text-[13px] font-medium text-white truncate block hover:underline"
            >
              {displayName}
            </Link>
            <p className="text-[11px] text-white/45">{roleLabel}</p>
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
      <aside className="hidden lg:flex w-[300px] flex-shrink-0 h-screen sticky top-0">
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
          <SheetContent side="left" className="p-0 w-[300px] border-0 bg-sidebar">
            {sidebarContent}
          </SheetContent>
        </Sheet>
        <Link to="/dashboard">
          <img
            src={grattiaLogo}
            alt="Grattia Logo"
            className="h-7 w-auto"
          />
        </Link>
      </div>
    </>
  );
};
