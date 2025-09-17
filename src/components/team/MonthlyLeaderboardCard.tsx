
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Medal, Trophy, Star, Calendar } from "lucide-react";

type LeaderboardMember = {
  userId: string;
  name: string;
  points: number;
  rank: number;
};

export function MonthlyLeaderboardCard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { companyId } = useAuth();

  useEffect(() => {
    if (companyId) {
      fetchMonthlyLeaderboard();
    }
  }, [companyId]);

  const fetchMonthlyLeaderboard = async () => {
    if (!companyId) return;
    
    try {
      setIsLoading(true);
      
      // Get current month in YYYY-MM format
      const currentMonth = new Date().toISOString().slice(0, 7);
      
      // Fetch point transactions for current month, grouped by recipient
      const { data: transactions, error: transactionsError } = await supabase
        .from('point_transactions')
        .select(`
          recipient_profile_id,
          points
        `)
        .eq('company_id', companyId)
        .gte('created_at', `${currentMonth}-01`)
        .lt('created_at', `${currentMonth}-31T23:59:59`);
      
      if (transactionsError) throw transactionsError;
      
      if (!transactions?.length) {
        setLeaderboard([]);
        return;
      }
      
      // Group points by recipient and calculate totals
      const pointsByUser = transactions.reduce((acc, transaction) => {
        const userId = transaction.recipient_profile_id;
        acc[userId] = (acc[userId] || 0) + transaction.points;
        return acc;
      }, {} as Record<string, number>);
      
      // Get unique user IDs
      const userIds = Object.keys(pointsByUser);
      
      if (!userIds.length) {
        setLeaderboard([]);
        return;
      }
      
      // Fetch user profiles from profiles table (include all active members)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .in('id', userIds);
      
      if (profilesError) throw profilesError;
      
      // Create profile map for easy lookup
      const profileMap = new Map();
      profiles?.forEach(profile => {
        profileMap.set(profile.id, profile);
      });
      
      // Format leaderboard with profile data and ranks
      const formattedLeaderboard: LeaderboardMember[] = userIds
        .map(userId => {
          const profile = profileMap.get(userId);
          
          if (!profile) return null;
          
          const memberName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
          
          return {
            userId,
            name: memberName || 'No Name',
            points: pointsByUser[userId] || 0,
            rank: 0 // Will be set after sorting
          };
        })
        .filter(Boolean)
        .sort((a, b) => b!.points - a!.points)
        .slice(0, 10) // Top 10
        .map((member, index) => ({
          ...member!,
          rank: index + 1
        }));
      
      setLeaderboard(formattedLeaderboard);
      
    } catch (error) {
      console.error("Error fetching monthly leaderboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

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

  const currentMonthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <Card className="dashboard-card">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-[#F572FF]" />
          <CardTitle className="text-base sm:text-lg">Monthly Leaderboard</CardTitle>
        </div>
        <CardDescription className="text-xs sm:text-sm">
          Top performers for {currentMonthName}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#F572FF]" />
          </div>
        ) : leaderboard.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
               <TableHeader>
                 <TableRow>
                   <TableHead className="text-xs sm:text-sm">Rank</TableHead>
                   <TableHead className="text-xs sm:text-sm">Name</TableHead>
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
                     <TableCell className="text-right font-semibold text-xs sm:text-sm text-[#F572FF]">{member.points}</TableCell>
                   </TableRow>
                 ))}
               </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-sm">No recognition given this month yet</p>
            <p className="text-xs sm:text-sm mt-2">Be the first to give points to a teammate!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
