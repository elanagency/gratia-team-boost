import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Loader2, Medal, Trophy, Star, Users } from "lucide-react";

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
  const { companyId } = useAuth();
  const navigate = useNavigate();

  const fetchLeaderboard = useCallback(async () => {
    if (!companyId) return;
    
    try {
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
      
      // Fetch all point transactions for this company
      const { data: transactions, error: transactionsError } = await supabase
        .from('point_transactions')
        .select('recipient_profile_id, points')
        .eq('company_id', companyId);
      
      if (transactionsError) throw transactionsError;
      
      // Calculate total recognition points received for each user
      const pointsMap = new Map<string, number>();
      if (transactions?.length) {
        transactions.forEach(transaction => {
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
      setIsLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Set up real-time updates for point transactions
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
        () => {
          fetchLeaderboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId, fetchLeaderboard]);


  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-4 w-4 sm:h-5 sm:w-5 text-amber-700" />;
      default:
        return <Star className="h-4 w-4 sm:h-5 sm:w-5 text-[#F572FF]" />;
    }
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
            <p className="text-sm text-gray-500 mb-2">Build your team to get started</p>
            <p className="text-xs text-gray-400 mb-4">Add team members to start giving recognition</p>
            <Button 
              onClick={() => navigate('/dashboard?tab=settings')}
              className="bg-[#F572FF] hover:bg-[#F572FF]/90 text-white"
            >
              Add Your Team Members
            </Button>
          </div>
        ) : leaderboard.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
               <TableHeader>
                 <TableRow>
                   <TableHead className="text-xs sm:text-sm">Rank</TableHead>
                   <TableHead className="text-xs sm:text-sm">Name</TableHead>
                   <TableHead className="hidden md:table-cell text-xs sm:text-sm">Department</TableHead>
                   <TableHead className="text-right text-xs sm:text-sm">Points</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {leaderboard.map((member) => (
                   <TableRow key={member.userId}>
                     <TableCell className="font-medium">
                       <div className="flex items-center gap-1 sm:gap-2">
                         {getRankIcon(member.rank)}
                         <span className="text-xs sm:text-sm">{member.rank}</span>
                       </div>
                     </TableCell>
                     <TableCell className="text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">{member.name}</TableCell>
                     <TableCell className="hidden md:table-cell text-xs sm:text-sm">{member.department || '-'}</TableCell>
                     <TableCell className="text-right font-semibold text-xs sm:text-sm">{member.points}</TableCell>
                   </TableRow>
                 ))}
               </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No team members yet</p>
            <p className="text-xs sm:text-sm mt-2">Start giving points to recognize team members</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}