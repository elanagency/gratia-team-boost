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
  Clock,
  TrendingUp
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { TeamSlotsBillingButton } from "@/components/billing/TeamSlotsBillingButton";

interface SubscriptionStatus {
  has_subscription: boolean;
  status: string;
  team_slots: number;
  used_slots: number;
  available_slots: number;
  next_billing_date: string | null;
  amount_per_slot: number;
  slot_utilization: number;
}

export const SubscriptionStatusCard = () => {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const { user, companyId } = useAuth();

  const fetchSubscriptionStatus = async () => {
    if (!user || !companyId) {
      console.log("No user or company ID available, cannot fetch subscription status");
      return;
    }
    
    setIsLoading(true);
    setHasError(false);
    try {
      // Check if we have a valid session to use for authentication
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error("No valid session found");
      }

      console.log("Fetching subscription status for company:", companyId);
      
      const { data, error } = await supabase.functions.invoke('check-subscription-status');
      
      if (error) {
        console.error("Function invocation error:", error);
        throw error;
      }
      
      console.log("Subscription status data:", data);
      setSubscriptionStatus(data);
    } catch (error) {
      console.error("Error fetching subscription status:", error);
      setHasError(true);
      
      // For new companies or when there's an error, set default values to allow purchase
      setSubscriptionStatus({
        has_subscription: false,
        status: 'inactive',
        team_slots: 0,
        used_slots: 0,
        available_slots: 0,
        next_billing_date: null,
        amount_per_slot: 299,
        slot_utilization: 0,
      });
      
      toast.error("Unable to load subscription status, but you can still purchase team slots");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionStatus();
  }, [user, companyId]);

  // Check for setup success in URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const setup = urlParams.get('setup');
    
    if (setup === 'success') {
      toast.success("Team slots purchased successfully!");
      // Remove the query param and refresh subscription status
      window.history.replaceState({}, '', window.location.pathname);
      setTimeout(() => {
        fetchSubscriptionStatus();
      }, 2000);
    } else if (setup === 'cancelled') {
      toast.error("Team slots purchase was cancelled");
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  if (isLoading) {
    return (
      <Card className="dashboard-card">
        <div className="card-header">
          <h2 className="card-title">Team Slots & Billing</h2>
        </div>
        <div className="p-6">
          <div className="animate-pulse">Loading subscription status...</div>
        </div>
      </Card>
    );
  }

  // Always show the card and allow purchasing, even if there was an error
  if (!subscriptionStatus) {
    return (
      <Card className="dashboard-card">
        <div className="card-header">
          <h2 className="card-title">Team Slots & Billing</h2>
        </div>
        <div className="p-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">Get Started with Team Slots</h4>
            <p className="text-sm text-blue-700 mb-4">
              Purchase team slots to start adding team members to your organization.
            </p>
            <div className="text-sm text-blue-600 mb-4">
              <p>• $2.99 per team slot per month</p>
              <p>• Choose any number of slots (e.g., 5, 7, 12, 25)</p>
              <p>• Add team members up to your slot limit</p>
              <p>• Upgrade or downgrade anytime</p>
            </div>
            <TeamSlotsBillingButton 
              currentSlots={0}
              onSuccess={fetchSubscriptionStatus}
            />
          </div>
        </div>
      </Card>
    );
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

  const monthlyTotal = (subscriptionStatus.team_slots * subscriptionStatus.amount_per_slot) / 100;
  const utilizationColor = subscriptionStatus.slot_utilization >= 90 ? 'text-red-600' : 
                          subscriptionStatus.slot_utilization >= 75 ? 'text-yellow-600' : 
                          'text-green-600';

  return (
    <Card className="dashboard-card">
      <div className="card-header">
        <h2 className="card-title">Team Slots & Billing</h2>
        <Button 
          variant="outline" 
          size="sm"
          onClick={fetchSubscriptionStatus}
        >
          Refresh
        </Button>
      </div>
      
      <div className="p-6 space-y-4">
        {hasError && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-amber-800">
              ⚠️ Unable to load current subscription data, but you can still manage team slots below.
            </p>
          </div>
        )}

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
                  <p className="text-sm text-gray-600">Team Slots</p>
                  <p className="text-lg font-semibold">
                    {subscriptionStatus.used_slots} / {subscriptionStatus.team_slots}
                  </p>
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

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Slot Utilization</span>
                <span className={`text-sm font-medium ${utilizationColor}`}>
                  {subscriptionStatus.slot_utilization}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    subscriptionStatus.slot_utilization >= 90 ? 'bg-red-500' :
                    subscriptionStatus.slot_utilization >= 75 ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(subscriptionStatus.slot_utilization, 100)}%` }}
                />
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
              <h4 className="font-medium text-blue-800 mb-2">Team Slots Information</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• $2.99 per team slot per month</li>
                <li>• Add team members up to your slot limit</li>
                <li>• Upgrade or downgrade anytime</li>
                <li>• Available slots: {subscriptionStatus.available_slots}</li>
                {subscriptionStatus.slot_utilization >= 90 && (
                  <li className="text-amber-700 font-medium">
                    • ⚠️ Running low on slots - consider upgrading
                  </li>
                )}
              </ul>
            </div>

            <div className="pt-4">
              <TeamSlotsBillingButton 
                currentSlots={subscriptionStatus.team_slots}
                onSuccess={fetchSubscriptionStatus}
              />
            </div>
          </>
        ) : subscriptionStatus.used_slots > 0 ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="font-medium text-amber-800 mb-2">Team Slots Required</h4>
            <p className="text-sm text-amber-700 mb-4">
              You have {subscriptionStatus.used_slots} team member{subscriptionStatus.used_slots > 1 ? 's' : ''} but no active subscription. 
              Please purchase team slots to continue using the service.
            </p>
            <TeamSlotsBillingButton 
              currentSlots={0}
              suggestedSlots={Math.max(5, subscriptionStatus.used_slots + 2)}
              onSuccess={fetchSubscriptionStatus}
            />
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-2">No Active Subscription</h4>
            <p className="text-sm text-gray-600 mb-3">
              Purchase team slots to start adding team members to your organization.
            </p>
            <div className="text-sm text-gray-500 mb-4">
              <p>• $2.99 per team slot per month</p>
              <p>• Choose any number of slots (e.g., 5, 7, 12, 25)</p>
              <p>• Add team members up to your slot limit</p>
              <p>• Upgrade or downgrade anytime</p>
            </div>
            <TeamSlotsBillingButton 
              currentSlots={0}
              onSuccess={fetchSubscriptionStatus}
            />
          </div>
        )}
      </div>
    </Card>
  );
};
