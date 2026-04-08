import { useState, useEffect, useCallback } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

type LeaderboardMember = {
  userId: string;
  name: string;
  department: string | null;
  points: number;
  rank: number;
};


export function LeaderboardCard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { companyId, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();

  const fetchLeaderboard = useCallback(async () => {
    if (!companyId) return;
    
    try {
      setIsLoading(true);
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, department, is_admin')
        .eq('company_id', companyId)
        .eq('status', 'active');
      
      if (profilesError) throw profilesError;
      
      if (!profiles?.length) {
        setLeaderboard([]);
        return;
      }
      
      const { data: transactions, error: transactionsError } = await supabase
        .from('point_transactions')
        .select('recipient_profile_id, sender_profile_id, points')
        .eq('company_id', companyId)
        .gt('points', 0);

      if (transactionsError) throw transactionsError;

      const pointsMap = new Map<string, number>();
      if (transactions?.length) {
        transactions
          .filter(t => t.sender_profile_id !== t.recipient_profile_id)
          .forEach(transaction => {
            const currentPoints = pointsMap.get(transaction.recipient_profile_id) || 0;
            pointsMap.set(transaction.recipient_profile_id, currentPoints + transaction.points);
          });
      }
      
      const formattedLeaderboard: LeaderboardMember[] = profiles
        .map(profile => ({
          userId: profile.id,
          name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'No Name',
          department: profile.department || null,
          points: pointsMap.get(profile.id) || 0,
          rank: 0
        }))
        .sort((a, b) => b.points - a.points)
        .slice(0, 10) // fetch top 10, slice to 5 in render per view
        .map((member, index) => ({
          ...member,
          rank: index + 1
        }));
      
      setLeaderboard(formattedLeaderboard);
      
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (isAuthLoading) return;
    if (companyId) {
      fetchLeaderboard();
    } else {
      setIsLoading(false);
    }
  }, [companyId, isAuthLoading]);

  useEffect(() => {
    if (!companyId) return;

    const channel = supabase
      .channel('leaderboard-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'point_transactions',
          filter: `company_id=eq.${companyId}`
        },
        () => fetchLeaderboard()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [companyId]);

  const personLeaderboard = leaderboard.slice(0, 5).map((m, i) => ({ ...m, rank: i + 1 }));

  const avatarColors = [
    "bg-blue-100 text-blue-700",
    "bg-green-100 text-green-700",
    "bg-purple-100 text-purple-700",
    "bg-pink-100 text-pink-700",
    "bg-orange-100 text-orange-700",
  ];

  const getInitials = (name: string) =>
    name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  const formatPoints = (points: number) => points.toLocaleString();

  return (
    <div className="rounded-[13.375px] border border-[#E8E6F0] overflow-hidden bg-white" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Header */}
      <div
        className="flex items-center justify-between border-b border-[#E8E6F0]"
        style={{ height: "44.5px", padding: "0 15px" }}
      >
        <span style={{ fontSize: "14px", fontWeight: 600, color: "#0F0533" }}>
          Leaderboard
        </span>
        <button
          className="flex items-center gap-0.5 hover:opacity-70 transition-opacity"
          style={{ fontSize: "12px", fontWeight: 400, color: "#9996AA" }}
        >
          View all
          <ChevronRight className="shrink-0" style={{ width: 14, height: 14, color: "#9996AA" }} />
        </button>
      </div>

      {/* Body */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#7F2BFE" }} />
        </div>
      ) : personLeaderboard.length > 0 ? (
        <div>
          {personLeaderboard.map((member, index) => (
            <div
              key={member.userId}
              className={`flex items-center ${index < personLeaderboard.length - 1 ? "border-b border-[#E8E6F0]" : ""}`}
              style={{ height: "54.75px", padding: "0 15px", gap: "11.25px" }}
            >
              {/* Rank */}
              <span
                className="shrink-0"
                style={{ fontSize: "12px", fontWeight: 600, color: member.rank <= 3 ? "#7F2BFE" : "#9996AA", width: "16px", textAlign: "center" }}
              >
                {member.rank}
              </span>

              {/* Avatar */}
              <Avatar className="shrink-0" style={{ width: "37px", height: "37px" }}>
                <AvatarFallback
                  className={avatarColors[index % avatarColors.length]}
                  style={{ fontSize: "12px", fontWeight: 500 }}
                >
                  {getInitials(member.name)}
                </AvatarFallback>
              </Avatar>

              {/* Name + Department */}
              <div className="flex-1 min-w-0">
                <p className="truncate" style={{ fontSize: "13px", fontWeight: 500, color: "#0F0533", lineHeight: "19.5px" }}>
                  {member.name}
                </p>
                {member.department && (
                  <p className="truncate" style={{ fontSize: "11px", fontWeight: 400, color: "#9996AA", lineHeight: "16.5px" }}>
                    {member.department}
                  </p>
                )}
              </div>

              {/* Points */}
              <span className="shrink-0" style={{ fontSize: "13px", fontWeight: 600, color: "#0F0533" }}>
                {formatPoints(member.points)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8" style={{ color: "#9996AA" }}>
          <p style={{ fontSize: "13px" }}>No recognition data yet</p>
          <p style={{ fontSize: "11px", marginTop: "8px" }}>Start giving points to see the leaderboard</p>
        </div>
      )}
    </div>
  );
}
