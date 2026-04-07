import { useState, useEffect, useCallback, useMemo } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

type LeaderboardMember = {
  userId: string;
  name: string;
  department: string | null;
  role: string;
  points: number;
  rank: number;
};

const avatarColors = [
  "bg-blue-100 text-blue-700",
  "bg-green-100 text-green-700",
  "bg-purple-100 text-purple-700",
  "bg-pink-100 text-pink-700",
  "bg-orange-100 text-orange-700",
  "bg-cyan-100 text-cyan-700",
  "bg-yellow-100 text-yellow-700",
  "bg-rose-100 text-rose-700",
];

const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

function generateMonthOptions(count: number) {
  const months: { label: string; value: string; startDate: string; endDate: string }[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth();
    const label = d.toLocaleString("default", { month: "long", year: "numeric" });
    const value = `${year}-${String(month + 1).padStart(2, "0")}`;
    const startDate = `${value}-01T00:00:00`;
    const endD = new Date(year, month + 1, 0);
    const endDate = `${value}-${String(endD.getDate()).padStart(2, "0")}T23:59:59`;
    months.push({ label, value, startDate, endDate });
  }
  return months;
}

const Leaderboard = () => {
  const { companyId, isLoading: isAuthLoading } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const monthOptions = useMemo(() => generateMonthOptions(6), []);
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0]?.value ?? "");

  const selectedOption = monthOptions.find((m) => m.value === selectedMonth);

  const fetchLeaderboard = useCallback(async () => {
    if (!companyId || !selectedOption) return;

    try {
      setIsLoading(true);

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, department, role")
        .eq("company_id", companyId)
        .eq("status", "active");

      if (profilesError) throw profilesError;
      if (!profiles?.length) {
        setLeaderboard([]);
        return;
      }

      const { data: transactions, error: transactionsError } = await supabase
        .from("point_transactions")
        .select("recipient_profile_id, sender_profile_id, points")
        .eq("company_id", companyId)
        .gte("created_at", selectedOption.startDate)
        .lte("created_at", selectedOption.endDate)
        .gt("points", 0);

      if (transactionsError) throw transactionsError;

      const pointsMap = new Map<string, number>();
      if (transactions?.length) {
        transactions
          .filter((t) => t.sender_profile_id !== t.recipient_profile_id)
          .forEach((t) => {
            pointsMap.set(t.recipient_profile_id, (pointsMap.get(t.recipient_profile_id) || 0) + t.points);
          });
      }

      const sorted: LeaderboardMember[] = profiles
        .map((p) => ({
          userId: p.id,
          name: `${p.first_name || ""} ${p.last_name || ""}`.trim() || "No Name",
          department: p.department || null,
          role: p.role || "member",
          points: pointsMap.get(p.id) || 0,
          rank: 0,
        }))
        .sort((a, b) => b.points - a.points)
        .map((m, i) => ({ ...m, rank: i + 1 }));

      setLeaderboard(sorted);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setIsLoading(false);
    }
  }, [companyId, selectedOption]);

  useEffect(() => {
    if (!isAuthLoading && companyId) fetchLeaderboard();
  }, [fetchLeaderboard, isAuthLoading, companyId]);

  useEffect(() => {
    if (!companyId) return;
    const channel = supabase
      .channel("leaderboard-page-updates")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "point_transactions", filter: `company_id=eq.${companyId}` }, () => fetchLeaderboard())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [companyId, fetchLeaderboard]);

  const topPerformer = leaderboard.length > 0 ? leaderboard[0] : null;
  const tableRows = leaderboard;

  return (
    <div className="flex gap-[30px]" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Left column — month filter */}
      <div className="w-[160px] shrink-0 flex flex-col gap-[6px]">
        <p style={{ fontSize: 12, fontWeight: 600, color: "#9996AA", marginBottom: 6, paddingLeft: 12 }}>
          FILTER BY MONTH
        </p>
        {monthOptions.map((m) => (
          <button
            key={m.value}
            onClick={() => setSelectedMonth(m.value)}
            className="text-left transition-colors"
            style={{
              fontSize: 13,
              fontWeight: selectedMonth === m.value ? 600 : 400,
              color: selectedMonth === m.value ? "#fff" : "#9996AA",
              background: selectedMonth === m.value ? "#7F2BFE" : "transparent",
              borderRadius: 9999,
              padding: "7px 14px",
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Right column — hero + table */}
      <div className="flex-1 min-w-0 flex flex-col gap-[22.5px]">
        {/* Page title */}
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F0533", lineHeight: "30px" }}>
            Leaderboard
          </h1>
          <p style={{ fontSize: 13, fontWeight: 400, color: "#9996AA", marginTop: 2 }}>
            {selectedOption?.label ?? ""}
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-7 w-7 animate-spin" style={{ color: "#7F2BFE" }} />
          </div>
        ) : (
          <>
            {/* Hero card for #1 */}
            {topPerformer && topPerformer.points > 0 && (
              <div
                className="rounded-[13.375px] border-2 border-[#5B21B6] flex items-center gap-4"
                style={{ padding: "16px 22px", background: "linear-gradient(135deg, rgba(91,33,182,0.06) 0%, rgba(91,33,182,0.02) 100%)" }}
              >
                <div className="relative" style={{ width: 52, height: 52, flexShrink: 0 }}>
                  <Avatar style={{ width: 52, height: 52 }}>
                    <AvatarFallback
                      className={avatarColors[0]}
                      style={{ fontSize: 18, fontWeight: 600 }}
                    >
                      {getInitials(topPerformer.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span
                    style={{
                      position: "absolute",
                      bottom: -2,
                      right: -2,
                      width: 18,
                      height: 18,
                      borderRadius: 9999,
                      background: "#5B21B6",
                      color: "#fff",
                      fontSize: 9,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "2px solid #fff",
                    }}
                  >
                    1
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div>
                    <p style={{ fontSize: 16, fontWeight: 700, color: "#0F0533", lineHeight: "22px" }}>
                      {topPerformer.name}
                    </p>
                    <p style={{ fontSize: 12, fontWeight: 400, color: "#9996AA", marginTop: 2 }}>
                      {topPerformer.department ? `${topPerformer.department} · ` : ""}
                      {topPerformer.role === "admin" ? "Admin" : "Member"}
                    </p>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#22C55E",
                        background: "rgba(34,197,94,0.1)",
                        borderRadius: 9999,
                        padding: "4px 14px",
                        display: "inline-block",
                        marginTop: 4,
                      }}
                    >
                      {topPerformer.points.toLocaleString()} points
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Table */}
            <div className="rounded-[13.375px] border border-[#E8E6F0] overflow-hidden bg-white">
              {/* Table header */}
              <div
                className="flex items-center border-b border-[#E8E6F0]"
                style={{ height: 42, padding: "0 22.5px", fontSize: 11, fontWeight: 600, color: "#9996AA", textTransform: "uppercase", letterSpacing: "0.04em", background: "#F8F6FF" }}
              >
                <span style={{ width: 50 }}>Rank</span>
                <span className="flex-1">Name</span>
                <span style={{ width: 140 }}>Department</span>
                <span style={{ width: 90, textAlign: "right" }}>Points</span>
              </div>

              {/* Rows */}
              {tableRows.length > 0 ? (
                tableRows.map((member, index) => (
                  <div
                    key={member.userId}
                    className={`flex items-center ${index < tableRows.length - 1 ? "border-b border-[#E8E6F0]" : ""}`}
                    style={{ height: 58, padding: "0 22.5px" }}
                  >
                    {/* Rank */}
                    <span
                      style={{
                        width: 50,
                        fontSize: 13,
                        fontWeight: 600,
                        color: member.rank <= 3 ? "#7F2BFE" : "#9996AA",
                      }}
                    >
                      {member.rank}
                    </span>

                    {/* Avatar + name */}
                    <div className="flex-1 flex items-center gap-[11.25px] min-w-0">
                      <Avatar style={{ width: 34, height: 34 }} className="shrink-0">
                        <AvatarFallback
                          className={avatarColors[index % avatarColors.length]}
                          style={{ fontSize: 11, fontWeight: 500 }}
                        >
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate" style={{ fontSize: 13, fontWeight: 500, color: "#0F0533", lineHeight: "19px" }}>
                          {member.name}
                        </p>
                        <p className="truncate" style={{ fontSize: 11, fontWeight: 400, color: "#9996AA", lineHeight: "16px" }}>
                          {member.role === "admin" ? "Admin" : "Member"}
                        </p>
                      </div>
                    </div>

                    {/* Department */}
                    <span
                      className="truncate"
                      style={{ width: 140, fontSize: 13, fontWeight: 400, color: "#9996AA" }}
                    >
                      {member.department || "—"}
                    </span>

                    {/* Points */}
                    <span style={{ width: 90, display: "flex", justifyContent: "flex-end" }}>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#22C55E",
                          background: "rgba(34,197,94,0.1)",
                          borderRadius: 12,
                          padding: "4px 14px",
                          display: "inline-block",
                        }}
                      >
                        {member.points.toLocaleString()}
                      </span>
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-12" style={{ color: "#9996AA" }}>
                  <p style={{ fontSize: 13 }}>No recognition data for this month</p>
                  <p style={{ fontSize: 11, marginTop: 8 }}>Start giving points to see the leaderboard</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
