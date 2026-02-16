import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Loader2, Trophy, Users } from "lucide-react";

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
  const [isOnlyAdmin, setIsOnlyAdmin] = useState(false);
  const { companyId, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();

  const fetchLeaderboard = useCallback(async () => {
    console.log('[LeaderboardCard] fetchLeaderboard called with companyId:', companyId);
    if (!companyId) {
      console.log('[LeaderboardCard] No companyId, returning early');
      return;
    }
    
    try {
      console.log('[LeaderboardCard] Setting loading to true');
      setIsLoading(true);
      
      // Fetch all active company members first
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

      // Check if only one user exists and they are an admin
      const adminOnlyCheck = profiles.length === 1 && profiles[0].is_admin;
      setIsOnlyAdmin(adminOnlyCheck);
      
      // Fetch only positive peer-to-peer recognition transactions
      const { data: transactions, error: transactionsError } = await supabase
        .from('point_transactions')
        .select('recipient_profile_id, sender_profile_id, points')
        .eq('company_id', companyId)
        .gt('points', 0); // Only positive points

      if (transactionsError) throw transactionsError;

      // Calculate total recognition points received for each user
      // Exclude self-transactions (these could be system grants)
      const pointsMap = new Map<string, number>();
      if (transactions?.length) {
        transactions
          .filter(t => t.sender_profile_id !== t.recipient_profile_id) // Exclude self-transactions
          .forEach(transaction => {
            const currentPoints = pointsMap.get(transaction.recipient_profile_id) || 0;
            pointsMap.set(transaction.recipient_profile_id, currentPoints + transaction.points);
          });
      }
      
      // Format leaderboard with all active members, sorted by recognition points
      const formattedLeaderboard: LeaderboardMember[] = profiles
        .map(profile => {
          const memberName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
          
          return {
            userId: profile.id,
            name: memberName || 'No Name',
            department: profile.department || null,
            points: pointsMap.get(profile.id) || 0,
            rank: 0 // Will be set after sorting
          };
        })
        .sort((a, b) => b.points - a.points) // Sort by points descending
        .slice(0, 10) // Limit to top 10
        .map((member, index) => ({
          ...member,
          rank: index + 1
        }));
      
      setLeaderboard(formattedLeaderboard);
      
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      console.log('[LeaderboardCard] Setting loading to false');
      setIsLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    console.log('[LeaderboardCard] useEffect triggered - isAuthLoading:', isAuthLoading, 'companyId:', companyId);
    
    // Wait for auth to finish loading before taking any action
    if (isAuthLoading) {
      console.log('[LeaderboardCard] Auth still loading, waiting...');
      return;
    }

    // Auth is ready, now check if we have the data we need
    if (companyId) {
      console.log('[LeaderboardCard] Auth ready with companyId, calling fetchLeaderboard');
      fetchLeaderboard();
    } else {
      console.log('[LeaderboardCard] Auth ready but no companyId, stopping loading');
      setIsLoading(false);
    }
  }, [companyId, isAuthLoading]); // Add isAuthLoading to dependencies

  // Set up real-time updates for point transactions
  useEffect(() => {
    if (!companyId) return;

    console.log('[LeaderboardCard] Setting up real-time updates for companyId:', companyId);
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
        () => {
          console.log('[LeaderboardCard] Real-time update triggered, calling fetchLeaderboard');
          fetchLeaderboard();
        }
      )
      .subscribe();

    return () => {
      console.log('[LeaderboardCard] Cleaning up real-time channel');
      supabase.removeChannel(channel);
    };
  }, [companyId]); // Remove fetchLeaderboard from dependencies


  const getRankBadgeStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-yellow-400 text-yellow-900";
      case 2:
        return "bg-gray-300 text-gray-700";
      case 3:
        return "bg-amber-600 text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const avatarColors = [
    "bg-blue-100 text-blue-700",
    "bg-green-100 text-green-700",
    "bg-purple-100 text-purple-700",
    "bg-pink-100 text-pink-700",
    "bg-orange-100 text-orange-700",
    "bg-teal-100 text-teal-700",
    "bg-red-100 text-red-700",
    "bg-indigo-100 text-indigo-700",
    "bg-cyan-100 text-cyan-700",
    "bg-rose-100 text-rose-700",
  ];

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="dashboard-card">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
          <Trophy className="h-5 w-5 text-[#F572FF]" />
          Team Leaderboard
        </CardTitle>
        <CardDescription className="text-sm">Top performers by recognition points</CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
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
        ) : leaderboard.length > 0 ? (
          <div className="space-y-2">
            {leaderboard.map((member, index) => (
              <div
                key={member.userId}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors"
              >
                {/* Rank badge */}
                <div
                  className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0 ${getRankBadgeStyle(member.rank)}`}
                >
                  {member.rank}
                </div>

                {/* Avatar */}
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className={`text-xs font-medium ${avatarColors[index % avatarColors.length]}`}>
                    {getInitials(member.name)}
                  </AvatarFallback>
                </Avatar>

                {/* Name & department */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{member.name}</p>
                  {member.department && (
                    <p className="text-xs text-muted-foreground truncate">{member.department}</p>
                  )}
                </div>

                {/* Points */}
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
        )}
      </CardContent>
    </Card>
  );
}