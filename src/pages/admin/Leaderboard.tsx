import { useState, useEffect, useCallback, useMemo } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Calendar } from "lucide-react";

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
    <>
      {/* Fixed sub-sidebar */}
      <div
        className="hidden lg:flex flex-col"
        style={{
          position: "fixed",
          left: 300,
          top: 0,
          width: 240,
          height: "100vh",
          borderRight: "1px solid #E8E6F0",
          background: "#fff",
          paddingTop: 22.5,
          paddingLeft: 30,
          paddingRight: 30,
          zIndex: 30,
          overflowY: "auto",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <h1
          style={{
            fontSize: 22,
            fontWeight: 600,
            color: "#0F0533",
            marginBottom: 22.5,
          }}
        >
          Leaderboard
        </h1>
        <div className="flex flex-col">
          {monthOptions.map((m) => {
            const isActive = selectedMonth === m.value;
            return (
              <button
                key={m.value}
                onClick={() => setSelectedMonth(m.value)}
                className="transition-colors"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 9.375,
                  fontSize: 14,
                  fontWeight: 500,
                  lineHeight: "21px",
                  color: isActive ? "#0F0533" : "#9996AA",
                  background: isActive ? "#F5F5F7" : "transparent",
                  borderRadius: 13.375,
                  padding: "7.5px 11.25px",
                  height: 36,
                  width: "100%",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <Calendar size={16} color={isActive ? "#0F0533" : "#9996AA"} strokeWidth={2} style={{ flexShrink: 0 }} />
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content area */}
      <div
        className="lg:ml-[240px]"
        style={{ padding: "22.5px 22.5px 22.5px 30px", minHeight: "100%", marginRight: -16, fontFamily: "Inter, sans-serif" }}
      >
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-7 w-7 animate-spin" style={{ color: "#7F2BFE" }} />
          </div>
        ) : (
          <div className="flex flex-col gap-[22.5px]">
            {/* Hero card for #1 */}
            {topPerformer && topPerformer.points > 0 && (
              <div
                style={{
                  borderRadius: 15,
                  border: "2px solid #7F2BFE",
                  background: "linear-gradient(135deg, rgba(127,43,254,0.08) 0%, rgba(252,91,255,0.08) 100%)",
                  padding: "24.5px",
                  display: "flex",
                  alignItems: "center",
                  gap: 20,
                }}
              >
                <div className="relative" style={{ width: 75, height: 75, flexShrink: 0 }}>
                  <Avatar style={{ width: 75, height: 75 }}>
                    <AvatarFallback
                      className={avatarColors[0]}
                      style={{ fontSize: 24, fontWeight: 600 }}
                    >
                      {getInitials(topPerformer.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span
                    style={{
                      position: "absolute",
                      bottom: -4,
                      right: -4,
                      width: 37.5,
                      height: 37.5,
                      borderRadius: 9999,
                      background: "linear-gradient(135deg, #7F2BFE, #FC5BFF)",
                      color: "#fff",
                      fontSize: 16,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "3px solid #fff",
                    }}
                  >
                    1
                  </span>
                </div>
                <div>
                  <p style={{ fontSize: 20, fontWeight: 600, color: "#0F0533", lineHeight: "30px" }}>
                    {topPerformer.name}
                  </p>
                  <p style={{ fontSize: 14, fontWeight: 400, color: "#9996AA", lineHeight: "21px", marginTop: 2 }}>
                    {topPerformer.department ? `${topPerformer.department} · ` : ""}
                    {topPerformer.role === "admin" ? "Admin" : "Member"}
                  </p>
                  <span
                    style={{
                      fontSize: 18,
                      fontWeight: 600,
                      color: "#15803D",
                      background: "#DCFCE7",
                      borderRadius: 9999,
                      padding: "8px 18px 7px 19px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginTop: 8,
                      lineHeight: "27px",
                    }}
                  >
                    {topPerformer.points.toLocaleString()} points
                  </span>
                </div>
              </div>
            )}

            {/* Table */}
            <div className="rounded-[13.375px] border border-[#E8E6F0] overflow-hidden bg-white">
              <div
                className="flex items-center border-b border-[#E8E6F0]"
                style={{ height: 42, padding: "0 22.5px", fontSize: 11, fontWeight: 600, color: "#9996AA", textTransform: "uppercase", letterSpacing: "0.04em", background: "#F8F6FF" }}
              >
                <span style={{ width: 50 }}>Rank</span>
                <span className="flex-1">Name</span>
                <span style={{ width: 140 }}>Department</span>
                <span style={{ width: 90, textAlign: "right" }}>Points</span>
              </div>

              {tableRows.length > 0 ? (
                tableRows.map((member, index) => (
                  <div
                    key={member.userId}
                    className={`flex items-center ${index < tableRows.length - 1 ? "border-b border-[#E8E6F0]" : ""}`}
                    style={{ height: 58, padding: "0 22.5px" }}
                  >
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
                    <span
                      className="truncate"
                      style={{ width: 140, fontSize: 13, fontWeight: 400, color: "#9996AA" }}
                    >
                      {member.department || "—"}
                    </span>
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
          </div>
        )}
      </div>
    </>
  );
};

export default Leaderboard;
