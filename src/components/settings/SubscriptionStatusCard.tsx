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

interface CompanyData {
  stripe_subscription_id: string | null;
  team_slots: number;
  subscription_status: string | null;
}

export const SubscriptionStatusCard = () => {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [hasExistingSubscription, setHasExistingSubscription] = useState(false);
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [showStripeDataWarning, setShowStripeDataWarning] = useState(false);
  const { user, companyId } = useAuth();

  const fetchCompanyData = async () => {
    if (!companyId) return null;
    
    try {
      const { data: company, error } = await supabase
        .from('companies')
        .select('stripe_subscription_id, team_slots, subscription_status')
        .eq('id', companyId)
        .single();
      
      if (error) {
        console.error("Error fetching company data:", error);
        return null;
      }
      
      setCompanyData(company);
      const hasStripeSubscriptionId = company?.stripe_subscription_id ? true : false;
      setHasExistingSubscription(hasStripeSubscriptionId);
      console.log("Company has existing subscription ID:", hasStripeSubscriptionId);
      
      return company;
    } catch (error) {
      console.error("Error in fetchCompanyData:", error);
      return null;
    }
  };

  const fetchSubscriptionStatus = async () => {
    if (!user || !companyId) {
      console.log("No user or company ID available, cannot fetch subscription status");
      return;
    }
    
    setIsLoading(true);
    setHasError(false);
    setShowStripeDataWarning(false);
    
    try {
      // First get company data to check if subscription exists
      const company = await fetchCompanyData();
      
      console.log("Fetching subscription status for company:", companyId);
      
      const { data, error } = await supabase.functions.invoke('check-subscription-status');
      
      if (error) {
        console.error("Function invocation error:", error);
        
        // If we have company data, use it as fallback
        if (company && company.stripe_subscription_id) {
          console.log("Using company data as fallback");
          // Get used slots directly from database
          const { data: usedSlotsData } = await supabase
            .rpc('get_used_team_slots', { company_id: companyId });
          
          const usedSlots = usedSlotsData || 0;
          const teamSlots = company.team_slots || 0;
          
          setSubscriptionStatus({
            has_subscription: true,
            status: company.subscription_status || 'active',
            team_slots: teamSlots,
            used_slots: usedSlots,
            available_slots: Math.max(0, teamSlots - usedSlots),
            next_billing_date: null,
            amount_per_slot: 299,
            slot_utilization: teamSlots > 0 ? Math.round((usedSlots / teamSlots) * 100) : 0,
          });
          
          // Only show Stripe warning if we have a subscription but couldn't get latest Stripe data
          setShowStripeDataWarning(true);
          return;
        }
        
        throw error;
      }
      
      console.log("Subscription status data:", data);
      setSubscriptionStatus(data);
      setShowStripeDataWarning(false);
    } catch (error) {
      console.error("Error fetching subscription status:", error);
      
      // Only set hasError to true if the company has an existing subscription
      setHasError(hasExistingSubscription);
      
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
      
      if (hasExistingSubscription) {
        toast.error("Unable to load subscription status, but you can still manage team slots");
      }
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
        {/* Only show Stripe data warning when we specifically couldn't get latest Stripe data but have cached data */}
        {showStripeDataWarning && subscriptionStatus?.has_subscription && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-amber-800">
              ⚠️ Unable to load latest subscription data from Stripe, showing cached information. You can still manage team slots below.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">Status</span>
          {getStatusBadge(subscriptionStatus.status)}
        </div>

        {subscriptionStatus.has_subscription ? (
          // ... keep existing code (subscription active UI)
        ) : subscriptionStatus.used_slots > 0 ? (
          // ... keep existing code (no subscription but used slots UI)
        ) : (
          // ... keep existing code (no subscription UI)
        )}
      </div>
    </Card>
  );
};
