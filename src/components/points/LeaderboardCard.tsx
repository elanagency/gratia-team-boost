
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Medal, Trophy, Star } from "lucide-react";

type LeaderboardMember = {
  userId: string;
  name: string;
  role: string;
  department: string | null;
  points: number;
  rank: number;
};

export function LeaderboardCard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { companyId } = useAuth();

  useEffect(() => {
    if (companyId) {
      fetchLeaderboard();
    }
  }, [companyId]);

  const fetchLeaderboard = async () => {
    if (!companyId) return;
    
    try {
      setIsLoading(true);
      
      // Fetch all point transactions for this company
      const { data: transactions, error: transactionsError } = await supabase
        .from('point_transactions')
        .select('recipient_profile_id, points')
        .eq('company_id', companyId);
      
      if (transactionsError) throw transactionsError;
      
      if (!transactions?.length) {
        setLeaderboard([]);
        return;
      }
      
      // Calculate total recognition points received for each user
      const pointsMap = new Map<string, number>();
      transactions.forEach(transaction => {
        const currentPoints = pointsMap.get(transaction.recipient_profile_id) || 0;
        pointsMap.set(transaction.recipient_profile_id, currentPoints + transaction.points);
      });
      
      // Get unique recipient IDs
      const recipientIds = Array.from(pointsMap.keys());
      
      if (!recipientIds.length) {
        setLeaderboard([]);
        return;
      }
      
      // Fetch company members to filter out admins and get roles and departments
      const { data: members, error: membersError } = await supabase
        .from('company_members')
        .select('profile_id, role, is_admin, department')
        .eq('company_id', companyId)
        .in('profile_id', recipientIds);
      
      if (membersError) throw membersError;
      
      // Filter out admins and get non-admin members with their recognition points
      const nonAdminMembers = members?.filter(member => !member.is_admin) || [];
      
      if (!nonAdminMembers.length) {
        setLeaderboard([]);
        return;
      }
      
      // Fetch profiles for non-admin members
      const nonAdminUserIds = nonAdminMembers.map(m => m.profile_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', nonAdminUserIds);
      
      if (profilesError) throw profilesError;
      
      // Create a map for easy profile lookup
      const profileMap = new Map();
      profiles?.forEach(profile => {
        profileMap.set(profile.id, profile);
      });
      
      // Format leaderboard with profile data and ranks, sorted by recognition points
      const formattedLeaderboard: LeaderboardMember[] = nonAdminMembers
        .map(member => {
          const profile = profileMap.get(member.profile_id);
          const memberName = profile ? 
            `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 
            'No Name';
          
          return {
            userId: member.profile_id,
            name: memberName || 'No Name',
            role: member.role || 'Member',
            department: member.department || null,
            points: pointsMap.get(member.profile_id) || 0,
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
        ) : leaderboard.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs sm:text-sm">Rank</TableHead>
                  <TableHead className="text-xs sm:text-sm">Name</TableHead>
                  <TableHead className="hidden sm:table-cell text-xs sm:text-sm">Role</TableHead>
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
                    <TableCell className="hidden sm:table-cell text-xs sm:text-sm">{member.role}</TableCell>
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
