
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
      
      // Fetch members with their points
      const { data: members, error: membersError } = await supabase
        .from('company_members')
        .select(`
          user_id,
          role,
          is_admin,
          points
        `)
        .eq('company_id', companyId)
        .order('points', { ascending: false })
        .limit(10);
      
      if (membersError) throw membersError;
      
      if (!members?.length) {
        setLeaderboard([]);
        return;
      }
      
      // Get user IDs for batch profile query
      const userIds = members.map(m => m.user_id);
      
      // Fetch profiles in batch
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', userIds);
      
      if (profilesError) throw profilesError;
      
      // Create a map for easy profile lookup
      const profileMap = new Map();
      profiles?.forEach(profile => {
        profileMap.set(profile.id, profile);
      });
      
      // Format leaderboard with profile data and ranks
      const formattedLeaderboard: LeaderboardMember[] = members.map((member, index) => {
        const profile = profileMap.get(member.user_id);
        const memberName = profile ? 
          `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 
          'No Name';
        
        return {
          userId: member.user_id,
          name: memberName || 'No Name',
          role: member.is_admin ? 'Admin' : member.role || 'Member',
          points: member.points || 0,
          rank: index + 1
        };
      });
      
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
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-700" />;
      default:
        return <Star className="h-5 w-5 text-[#F572FF]" />;
    }
  };

  return (
    <Card className="dashboard-card">
      <CardHeader>
        <CardTitle>Team Leaderboard</CardTitle>
        <CardDescription>Top performers by recognition points</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#F572FF]" />
          </div>
        ) : leaderboard.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Points</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboard.map((member) => (
                <TableRow key={member.userId}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {getRankIcon(member.rank)}
                      <span>{member.rank}</span>
                    </div>
                  </TableCell>
                  <TableCell>{member.name}</TableCell>
                  <TableCell>{member.role}</TableCell>
                  <TableCell className="text-right font-semibold">{member.points}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No team members yet</p>
            <p className="text-sm mt-2">Start giving points to recognize team members</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
