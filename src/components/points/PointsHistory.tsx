
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

type PointTransaction = {
  id: string;
  sender_id: string;
  recipient_id: string;
  sender_name: string;
  recipient_name: string;
  points: number;
  description: string;
  created_at: string;
};

type PointsHistoryProps = {
  personalView?: boolean;
};

export function PointsHistory({ personalView = false }: PointsHistoryProps) {
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { companyId, user } = useAuth();

  useEffect(() => {
    if (companyId) {
      fetchPointsHistory();
    }
  }, [companyId, personalView, user?.id]);

  const fetchPointsHistory = async () => {
    if (!companyId) return;
    
    try {
      setIsLoading(true);
      
      // Build the base query
      let query = supabase
        .from('point_transactions')
        .select('id, sender_profile_id, recipient_profile_id, points, description, created_at')
        .eq('company_id', companyId);
      
      // If personal view is enabled, only show transactions where the current user is involved
      if (personalView && user?.id) {
        query = query.or(`sender_profile_id.eq.${user.id},recipient_profile_id.eq.${user.id}`);
      }
        
      // Execute the query
      const { data: transactionsData, error: transactionsError } = await query
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (transactionsError) throw transactionsError;
      
      if (!transactionsData?.length) {
        setTransactions([]);
        return;
      }
      
      // Get all user IDs involved in transactions
      const userIds = new Set<string>();
      transactionsData.forEach(tx => {
        userIds.add(tx.sender_profile_id);
        userIds.add(tx.recipient_profile_id);
      });
      
      // Fetch profiles for these users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', Array.from(userIds));
      
      if (profilesError) throw profilesError;
      
      // Create a map for easy profile lookup
      const profileMap = new Map();
      profiles?.forEach(profile => {
        profileMap.set(profile.id, profile);
      });
      
      // Format transactions with user names
      const formattedTransactions = transactionsData.map(tx => {
        const senderProfile = profileMap.get(tx.sender_profile_id);
        const recipientProfile = profileMap.get(tx.recipient_profile_id);
        
        const senderName = senderProfile ? 
          `${senderProfile.first_name || ''} ${senderProfile.last_name || ''}`.trim() : 
          'Unknown User';
        
        const recipientName = recipientProfile ? 
          `${recipientProfile.first_name || ''} ${recipientProfile.last_name || ''}`.trim() : 
          'Unknown User';
        
        return {
          ...tx,
          sender_id: tx.sender_profile_id,
          recipient_id: tx.recipient_profile_id,
          sender_name: senderName,
          recipient_name: recipientName
        };
      });
      
      setTransactions(formattedTransactions);
      
    } catch (error) {
      console.error("Error fetching points history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="dashboard-card">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-base sm:text-lg">
          {personalView ? "My Point Transactions" : "Recent Point Transactions"}
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          {personalView ? "Points you've sent and received" : "Recent recognitions across your team"}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#F572FF]" />
          </div>
        ) : transactions.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="border-b border-gray-100 pb-3 sm:pb-4 last:border-0">
                <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs sm:text-sm">
                      <span className="text-[#F572FF] truncate">{transaction.sender_name}</span> gave{' '}
                      <span className="text-[#F572FF]">{transaction.points} points</span> to{' '}
                      <span className="text-[#F572FF] truncate">{transaction.recipient_name}</span>
                    </p>
                    <p className="mt-1 text-xs text-gray-600 line-clamp-2">{transaction.description}</p>
                  </div>
                  <div className="text-xs text-gray-400 flex-shrink-0">
                    {format(new Date(transaction.created_at), 'MMM d, yyyy')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">{personalView ? "No personal point transactions yet" : "No point transactions yet"}</p>
            <p className="text-xs sm:text-sm mt-2">
              {personalView ? "When you send or receive points, they will appear here" : "Start giving points to recognize team members"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
