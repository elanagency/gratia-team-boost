import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Award, ArrowDownLeft, ArrowUpRight } from "lucide-react";

export function PersonalStatsCard() {
  const { user, companyId, totalPoints } = useAuth();

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

  const items = [
    {
      label: "Points",
      value: totalPoints,
      icon: Award,
      color: "text-primary",
    },
    {
      label: "Received",
      value: stats?.received ?? 0,
      icon: ArrowDownLeft,
      color: "text-emerald-500",
    },
    {
      label: "Sent",
      value: stats?.sent ?? 0,
      icon: ArrowUpRight,
      color: "text-blue-500",
    },
  ];

  return (
    <Card className="border border-border rounded-xl shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Your Stats</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          {items.map((item) => (
            <div
              key={item.label}
              className="flex flex-col items-center gap-1 p-3 rounded-lg bg-muted/50"
            >
              <item.icon className={`h-5 w-5 ${item.color}`} />
              <span className="text-xl font-bold text-foreground">
                {item.value}
              </span>
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
