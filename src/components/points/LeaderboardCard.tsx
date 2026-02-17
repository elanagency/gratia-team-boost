import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Loader2, Trophy, Users, Building2 } from "lucide-react";

type LeaderboardMember = {
  userId: string;
  name: string;
  department: string | null;
  points: number;
  rank: number;
};

type DepartmentEntry = {
  department: string;
  points: number;
  rank: number;
};

type ViewMode = "person" | "department";

export function LeaderboardCard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnlyAdmin, setIsOnlyAdmin] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("person");
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
        setIsOnlyAdmin(false);
        return;
      }

      const adminOnlyCheck = profiles.length === 1 && profiles[0].is_admin;
      setIsOnlyAdmin(adminOnlyCheck);
      
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

  const getDepartmentLeaderboard = (): DepartmentEntry[] => {
    const deptMap = new Map<string, number>();
    leaderboard.forEach(member => {
      const dept = member.department || "No Department";
      deptMap.set(dept, (deptMap.get(dept) || 0) + member.points);
    });
    return Array.from(deptMap.entries())
      .map(([department, points]) => ({ department, points, rank: 0 }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 5)
      .map((entry, i) => ({ ...entry, rank: i + 1 }));
  };

  const personLeaderboard = leaderboard.slice(0, 5).map((m, i) => ({ ...m, rank: i + 1 }));
  const departmentLeaderboard = getDepartmentLeaderboard();

  const getRankBadgeStyle = (rank: number) => {
    switch (rank) {
      case 1: return "bg-yellow-400 text-yellow-900";
      case 2: return "bg-gray-300 text-gray-700";
      case 3: return "bg-amber-600 text-white";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const avatarColors = [
    "bg-blue-100 text-blue-700",
    "bg-green-100 text-green-700",
    "bg-purple-100 text-purple-700",
    "bg-pink-100 text-pink-700",
    "bg-orange-100 text-orange-700",
  ];

  const getInitials = (name: string) =>
    name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <Card className="dashboard-card flex flex-col">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <Trophy className="h-5 w-5 text-[#F572FF]" />
            Team Leaderboard
          </CardTitle>
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setViewMode("person")}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                viewMode === "person"
                  ? "bg-[#F572FF] text-white"
                  : "bg-background text-muted-foreground hover:bg-muted"
              }`}
            >
              Person
            </button>
            <button
              onClick={() => setViewMode("department")}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                viewMode === "department"
                  ? "bg-[#F572FF] text-white"
                  : "bg-background text-muted-foreground hover:bg-muted"
              }`}
            >
              Department
            </button>
          </div>
        </div>
        <CardDescription className="text-sm">
          {viewMode === "person" ? "Top performers by recognition points" : "Top departments by recognition points"}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 flex-1">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#F572FF]" />
          </div>
        ) : isOnlyAdmin ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground mb-2">Build your team to get started</p>
            <p className="text-xs text-muted-foreground mb-4">Add team members to start giving recognition</p>
            <Button 
              onClick={() => navigate('/dashboard/settings')}
              className="bg-[#F572FF] hover:bg-[#F572FF]/90 text-white"
            >
              Add Your Team Members
            </Button>
          </div>
        ) : viewMode === "person" ? (
          personLeaderboard.length > 0 ? (
            <div className="space-y-2">
              {personLeaderboard.map((member, index) => (
                <div
                  key={member.userId}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0 ${getRankBadgeStyle(member.rank)}`}>
                    {member.rank}
                  </div>
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className={`text-xs font-medium ${avatarColors[index % avatarColors.length]}`}>
                      {getInitials(member.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{member.name}</p>
                    {member.department && (
                      <p className="text-xs text-muted-foreground truncate">{member.department}</p>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-[#F572FF] shrink-0">
                    {member.points} pts
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No team members yet</p>
              <p className="text-xs sm:text-sm mt-2">Start giving points to recognize team members</p>
            </div>
          )
        ) : (
          departmentLeaderboard.length > 0 ? (
            <div className="space-y-2">
              {departmentLeaderboard.map((entry) => (
                <div
                  key={entry.department}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0 ${getRankBadgeStyle(entry.rank)}`}>
                    {entry.rank}
                  </div>
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted shrink-0">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{entry.department}</p>
                  </div>
                  <span className="text-sm font-semibold text-[#F572FF] shrink-0">
                    {entry.points} pts
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No department data yet</p>
              <p className="text-xs sm:text-sm mt-2">Assign departments to team members to see rankings</p>
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}
