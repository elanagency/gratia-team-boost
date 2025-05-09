
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

export function PointsHistory() {
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { companyId } = useAuth();

  useEffect(() => {
    if (companyId) {
      fetchPointsHistory();
    }
  }, [companyId]);

  const fetchPointsHistory = async () => {
    if (!companyId) return;
    
    try {
      setIsLoading(true);
      
      // Get recent transactions for this company
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('point_transactions')
        .select('id, sender_id, recipient_id, points, description, created_at')
        .eq('company_id', companyId)
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
        userIds.add(tx.sender_id);
        userIds.add(tx.recipient_id);
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
        const senderProfile = profileMap.get(tx.sender_id);
        const recipientProfile = profileMap.get(tx.recipient_id);
        
        const senderName = senderProfile ? 
          `${senderProfile.first_name || ''} ${senderProfile.last_name || ''}`.trim() : 
          'Unknown User';
        
        const recipientName = recipientProfile ? 
          `${recipientProfile.first_name || ''} ${recipientProfile.last_name || ''}`.trim() : 
          'Unknown User';
        
        return {
          ...tx,
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
      <CardHeader>
        <CardTitle>Recent Point Transactions</CardTitle>
        <CardDescription>Recent recognitions across your team</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#F572FF]" />
          </div>
        ) : transactions.length > 0 ? (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="border-b border-gray-100 pb-4 last:border-0">
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium">
                      <span className="text-[#F572FF]">{transaction.sender_name}</span> gave{' '}
                      <span className="text-[#F572FF]">{transaction.points} points</span> to{' '}
                      <span className="text-[#F572FF]">{transaction.recipient_name}</span>
                    </p>
                    <p className="mt-1 text-sm text-gray-600">{transaction.description}</p>
                  </div>
                  <div className="text-xs text-gray-400">
                    {format(new Date(transaction.created_at), 'MMM d, yyyy')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No point transactions yet</p>
            <p className="text-sm mt-2">Start giving points to recognize team members</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
