
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Calendar, 
  CreditCard, 
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

interface SubscriptionStatus {
  has_subscription: boolean;
  status: string;
  current_quantity: number;
  member_count: number;
  next_billing_date: string | null;
  amount_per_member: number;
}

export const SubscriptionStatusCard = () => {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchSubscriptionStatus = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription-status');
      
      if (error) throw error;
      
      setSubscriptionStatus(data);
    } catch (error) {
      console.error("Error fetching subscription status:", error);
      toast.error("Failed to fetch subscription status");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionStatus();
  }, [user]);

  if (isLoading) {
    return (
      <Card className="dashboard-card">
        <div className="card-header">
          <h2 className="card-title">Subscription Status</h2>
        </div>
        <div className="p-6">
          <div className="animate-pulse">Loading subscription status...</div>
        </div>
      </Card>
    );
  }

  if (!subscriptionStatus) {
    return null;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case 'past_due':
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertTriangle className="w-3 h-3 mr-1" />Past Due</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800"><Clock className="w-3 h-3 mr-1" />Inactive</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const monthlyTotal = (subscriptionStatus.current_quantity * subscriptionStatus.amount_per_member) / 100;

  return (
    <Card className="dashboard-card">
      <div className="card-header">
        <h2 className="card-title">Subscription Status</h2>
        <Button 
          variant="outline" 
          size="sm"
          onClick={fetchSubscriptionStatus}
        >
          Refresh
        </Button>
      </div>
      
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">Status</span>
          {getStatusBadge(subscriptionStatus.status)}
        </div>

        {subscriptionStatus.has_subscription ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Team Members</p>
                  <p className="text-lg font-semibold">{subscriptionStatus.member_count}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Monthly Total</p>
                  <p className="text-lg font-semibold">${monthlyTotal.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {subscriptionStatus.next_billing_date && (
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Next Billing Date</p>
                  <p className="font-medium">
                    {new Date(subscriptionStatus.next_billing_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">Billing Information</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• $2.99 per team member per month</li>
                <li>• Prorated billing when adding/removing members</li>
                <li>• Billed monthly on the 1st of each month</li>
                {subscriptionStatus.current_quantity !== subscriptionStatus.member_count && (
                  <li className="text-amber-700">
                    • Subscription quantity ({subscriptionStatus.current_quantity}) will be updated to match team size ({subscriptionStatus.member_count})
                  </li>
                )}
              </ul>
            </div>
          </>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-2">No Active Subscription</h4>
            <p className="text-sm text-gray-600 mb-3">
              Your subscription will start automatically when you add your first team member.
            </p>
            <div className="text-sm text-gray-500">
              <p>• $2.99 per team member per month</p>
              <p>• Free signup - pay only when you add team members</p>
              <p>• Prorated billing for mid-month additions</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
