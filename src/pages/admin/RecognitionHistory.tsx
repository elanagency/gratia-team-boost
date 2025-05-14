import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { Award } from "lucide-react";
import { Loader2 } from "lucide-react";
type Recognition = {
  id: string;
  sender_id: string;
  recipient_id: string;
  sender_name: string;
  recipient_name: string;
  points: number;
  description: string;
  created_at: string;
};
const RecognitionHistory = () => {
  const [recognitions, setRecognitions] = useState<Recognition[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const {
    companyId
  } = useAuth();
  useEffect(() => {
    const fetchRecognitions = async () => {
      if (!companyId) return;
      try {
        setIsLoading(true);

        // Get transactions for this company
        const {
          data: transactionsData,
          error: transactionsError
        } = await supabase.from('point_transactions').select('id, sender_id, recipient_id, points, description, created_at').eq('company_id', companyId).order('created_at', {
          ascending: false
        });
        if (transactionsError) throw transactionsError;
        if (!transactionsData?.length) {
          setRecognitions([]);
          return;
        }

        // Get all user IDs involved in transactions
        const userIds = new Set<string>();
        transactionsData.forEach(tx => {
          userIds.add(tx.sender_id);
          userIds.add(tx.recipient_id);
        });

        // Fetch profiles for these users
        const {
          data: profiles,
          error: profilesError
        } = await supabase.from('profiles').select('id, first_name, last_name').in('id', Array.from(userIds));
        if (profilesError) throw profilesError;

        // Create a map for easy profile lookup
        const profileMap = new Map();
        profiles?.forEach(profile => {
          profileMap.set(profile.id, profile);
        });

        // Format transactions with user names
        const formattedRecognitions = transactionsData.map(tx => {
          const senderProfile = profileMap.get(tx.sender_id);
          const recipientProfile = profileMap.get(tx.recipient_id);
          const senderName = senderProfile ? `${senderProfile.first_name || ''} ${senderProfile.last_name || ''}`.trim() : 'Unknown User';
          const recipientName = recipientProfile ? `${recipientProfile.first_name || ''} ${recipientProfile.last_name || ''}`.trim() : 'Unknown User';
          return {
            ...tx,
            sender_name: senderName,
            recipient_name: recipientName
          };
        });
        setRecognitions(formattedRecognitions);
      } catch (error) {
        console.error("Error fetching recognition history:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRecognitions();
  }, [companyId]);
  return <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Recognition History</h1>
      </div>
      
      <Card className="w-full">
        {isLoading ? <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#F572FF]" />
          </div> : recognitions.length > 0 ? <Table>
            
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recognitions.map(recognition => <TableRow key={recognition.id}>
                  <TableCell className="font-medium">
                    {format(new Date(recognition.created_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>{recognition.sender_name}</TableCell>
                  <TableCell>{recognition.recipient_name}</TableCell>
                  <TableCell className="font-semibold text-[#F572FF]">
                    {recognition.points}
                  </TableCell>
                  <TableCell>{recognition.description}</TableCell>
                </TableRow>)}
            </TableBody>
          </Table> : <div className="flex flex-col items-center justify-center py-12 text-center">
            <Award className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium">No recognitions yet</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-md">
              When team members recognize each other, the history will appear here.
            </p>
          </div>}
      </Card>
    </div>;
};
export default RecognitionHistory;