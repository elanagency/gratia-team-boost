import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function PersonalStatsCard() {
  const { user, companyId, totalPoints, firstName, lastName, avatarUrl } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["personal-transaction-stats", user?.id, companyId],
    queryFn: async () => {
      if (!user?.id || !companyId) return { received: 0, sent: 0 };

      const [{ count: received }, { count: sent }] = await Promise.all([
        supabase
          .from("point_transactions")
          .select("*", { count: "exact", head: true })
          .eq("recipient_profile_id", user.id)
          .eq("company_id", companyId),
        supabase
          .from("point_transactions")
          .select("*", { count: "exact", head: true })
          .eq("sender_profile_id", user.id)
          .eq("company_id", companyId),
      ]);

      return { received: received ?? 0, sent: sent ?? 0 };
    },
    enabled: !!user?.id && !!companyId,
  });

  const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();
  const fullName = `${firstName} ${lastName}`.trim();

  const statItems = [
    { value: totalPoints, label: "Points" },
    { value: stats?.received ?? 0, label: "Received" },
    { value: stats?.sent ?? 0, label: "Sent" },
  ];

  return (
    <div
      className="relative overflow-hidden border border-[#E8E6F0] p-4"
      style={{
        borderRadius: "13.375px",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Subtle gradient background */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          background: "linear-gradient(135deg, #7F2BFE 0%, #FC5BFF 100%)",
        }}
      />

      {/* Content */}
      <div className="relative flex flex-col gap-[15px]">
        {/* User info row */}
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={avatarUrl ?? undefined} alt={fullName} />
            <AvatarFallback
              className="text-xs font-semibold text-white"
              style={{ backgroundColor: "#7F2BFE" }}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span
              className="font-semibold leading-tight"
              style={{ fontSize: "14px", color: "#0F0533" }}
            >
              {fullName}
            </span>
            <span
              className="leading-tight"
              style={{ fontSize: "12px", color: "#8E8C95" }}
            >
              Team Member
            </span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          {statItems.map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-0.5">
              <span
                className="font-semibold"
                style={{ fontSize: "18px", color: "#0F0533" }}
              >
                {item.value.toLocaleString()}
              </span>
              <span
                style={{ fontSize: "11px", color: "#9996AA", fontWeight: 400, lineHeight: "16.5px" }}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
