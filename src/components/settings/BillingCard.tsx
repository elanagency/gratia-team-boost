import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SubscriptionStatusCard } from "./SubscriptionStatusCard";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BillingHistoryItem {
  id: string;
  date: string;
  amount: string;
  status: string;
  type: string;
  description: string;
  stripe_session_id?: string;
  stripe_payment_intent_id?: string;
}

export const BillingCard = () => {
  const { companyId } = useAuth();
  const [billingHistory, setBillingHistory] = useState<BillingHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBillingHistory = async () => {
    if (!companyId) return;
    setIsLoading(true);
    try {
      // Fetch company point transactions
      const {
        data: pointTransactions,
        error: pointError
      } = await supabase.from('company_point_transactions').select('*').eq('company_id', companyId).order('created_at', {
        ascending: false
      });
      if (pointError) throw pointError;

      // Fetch subscription events
      const {
        data: subscriptionEvents,
        error: subError
      } = await supabase.from('subscription_events').select('*').eq('company_id', companyId).order('created_at', {
        ascending: false
      });
      if (subError) throw subError;

      // Combine and format the data
      const combinedHistory: BillingHistoryItem[] = [];

      // Add point transactions
      pointTransactions?.forEach(transaction => {
        combinedHistory.push({
          id: transaction.id,
          date: new Date(transaction.created_at).toLocaleDateString(),
          amount: `$${(transaction.total_amount || transaction.amount * 1) / 100}`,
          status: transaction.payment_status === 'completed' ? 'Paid' : transaction.payment_status === 'pending' ? 'Pending' : 'Failed',
          type: 'Points Purchase',
          description: transaction.description,
          stripe_session_id: transaction.stripe_session_id,
          stripe_payment_intent_id: transaction.stripe_payment_intent_id
        });
      });

      // Add subscription events
      subscriptionEvents?.forEach(event => {
        let description = '';
        let amount = '$0.00';
        let status = 'Completed';
        
        // Handle different event types with better descriptions
        if (event.event_type === 'slots_purchased') {
          description = `Team slots purchased - ${event.new_slots} slots`;
        } else if (event.event_type === 'created') {
          description = `Subscription created - ${event.new_quantity} members`;
        } else if (event.event_type === 'quantity_updated') {
          const isUpgrade = event.new_quantity > event.previous_quantity;
          const changeType = isUpgrade ? 'upgraded' : 'downgraded';
          description = `Subscription ${changeType} - ${event.previous_quantity} to ${event.new_quantity} members`;
          
          // For subscription updates, if no amount_charged, it was handled via proration
          if (!event.amount_charged || event.amount_charged === 0) {
            amount = 'Processed via Stripe proration';
            status = 'Processed';
            if (isUpgrade) {
              description += ' (prorated charge applied)';
            }
          }
        } else if (event.event_type === 'cancelled') {
          description = `Subscription cancelled`;
          status = 'Cancelled';
        } else {
          description = `Subscription ${event.event_type}`;
        }
        
        // Show amount if available and not already set to proration message
        if (event.amount_charged && event.amount_charged > 0 && amount === '$0.00') {
          amount = `$${(event.amount_charged / 100).toFixed(2)}`;
          status = 'Paid';
        }
        
        combinedHistory.push({
          id: event.id,
          date: new Date(event.created_at).toLocaleDateString(),
          amount: amount,
          status: status,
          type: 'Subscription',
          description: description,
          stripe_session_id: event.stripe_invoice_id
        });
      });

      // Sort by date (most recent first)
      combinedHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setBillingHistory(combinedHistory);
    } catch (error) {
      console.error("Error fetching billing history:", error);
      toast.error("Failed to fetch billing history");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingHistory();
  }, [companyId]);

  const getStatusBadge = (status: string) => {
    const baseClasses = "py-1 px-2 rounded-full text-xs";
    switch (status.toLowerCase()) {
      case 'paid':
        return `${baseClasses} bg-green-100 text-green-700`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-700`;
      case 'failed':
        return `${baseClasses} bg-red-100 text-red-700`;
      case 'processed':
        return `${baseClasses} bg-blue-100 text-blue-700`;
      case 'cancelled':
        return `${baseClasses} bg-gray-100 text-gray-700`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-700`;
    }
  };

  const getTypeBadge = (type: string) => {
    const baseClasses = "py-1 px-2 rounded-full text-xs";
    switch (type) {
      case 'Subscription':
        return `${baseClasses} bg-blue-100 text-blue-700`;
      case 'Points Purchase':
        return `${baseClasses} bg-purple-100 text-purple-700`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-700`;
    }
  };

  const handleDownload = (item: BillingHistoryItem) => {
    toast.info("Invoice download feature coming soon");
  };

  return (
    <div className="space-y-6">
      {/* Team Slots & Billing Section */}
      <SubscriptionStatusCard />
      
      {/* Billing History Section */}
      <Card className="dashboard-card">
        <div className="card-header">
          <h2 className="card-title">Billing History</h2>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchBillingHistory}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
        
        {isLoading ? (
          <div className="p-6">
            <div className="animate-pulse">Loading billing history...</div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-gray-100">
                <TableHead className="text-gray-500">Invoice</TableHead>
                <TableHead className="text-gray-500">Date</TableHead>
                <TableHead className="text-gray-500">Type</TableHead>
                <TableHead className="text-gray-500">Description</TableHead>
                <TableHead className="text-gray-500">Amount</TableHead>
                <TableHead className="text-gray-500">Status</TableHead>
                <TableHead className="text-gray-500">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {billingHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-gray-500">
                    No billing history found
                  </TableCell>
                </TableRow>
              ) : (
                billingHistory.map(item => (
                  <TableRow key={item.id} className="border-gray-100">
                    <TableCell className="font-medium">{item.id.substring(0, 8)}</TableCell>
                    <TableCell className="text-gray-600">{item.date}</TableCell>
                    <TableCell>
                      <span className={getTypeBadge(item.type)}>
                        {item.type}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-600">{item.description}</TableCell>
                    <TableCell className="text-gray-600">{item.amount}</TableCell>
                    <TableCell>
                      <span className={getStatusBadge(item.status)}>
                        {item.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-gray-500" 
                        onClick={() => handleDownload(item)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
};