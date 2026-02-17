import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, CreditCard, AlertTriangle, CheckCircle, Clock, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";

interface SubscriptionStatus {
  has_subscription: boolean;
  status: string;
  team_members: number;
  next_billing_date: string | null;
  amount_per_member: number;
  monthly_cost: number;
}

interface CompanyData {
  stripe_subscription_id: string | null;
  subscription_status: string | null;
}

export const SubscriptionStatusCard = () => {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [hasExistingSubscription, setHasExistingSubscription] = useState(false);
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const { user, companyId } = useAuth();
  const { memberPriceInCents, isLoading: isPricingLoading } = usePlatformSettings();

  const fetchCompanyData = async () => {
    if (!companyId) return null;
    
    try {
      const { data: company, error } = await supabase
        .from('companies')
        .select('stripe_subscription_id, subscription_status')
        .eq('id', companyId)
        .single();

      if (error) {
        console.error("Error fetching company data:", error);
        return null;
      }

      setCompanyData(company);
      const hasStripeSubscriptionId = !!company?.stripe_subscription_id;
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

    try {
      // First get company data to check if subscription exists
      const company = await fetchCompanyData();
      console.log("Fetching subscription status for company:", companyId);

      // Get current team member count
      const { data: memberCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact' })
        .eq('company_id', companyId)
        .eq('status', 'active');

      const teamMembers = memberCount?.length || 0;
      
      // Use pricing from the platform settings hook
      const amountPerMember = memberPriceInCents;
      
      if (company?.stripe_subscription_id) {
        // Try to get subscription details from check-subscription-status
        const { data, error } = await supabase.functions.invoke('check-subscription-status');
        
        if (!error && data) {
          console.log("Subscription status data:", data);
          setSubscriptionStatus({
            has_subscription: true,
            status: data.subscription_status || 'active',
            team_members: teamMembers,
            next_billing_date: data.subscription_end || null,
            amount_per_member: amountPerMember,
            monthly_cost: teamMembers * amountPerMember
          });
        } else {
          // Fallback to basic info
          setSubscriptionStatus({
            has_subscription: true,
            status: company.subscription_status || 'active',
            team_members: teamMembers,
            next_billing_date: null,
            amount_per_member: amountPerMember,
            monthly_cost: teamMembers * amountPerMember
          });
        }
      } else {
        // No subscription
        setSubscriptionStatus({
          has_subscription: false,
          status: 'inactive',
          team_members: teamMembers,
          next_billing_date: null,
          amount_per_member: amountPerMember,
          monthly_cost: 0
        });
      }
    } catch (error) {
      console.error("Error fetching subscription status:", error);
      setHasError(hasExistingSubscription);
      
      // Set default values
      setSubscriptionStatus({
        has_subscription: false,
        status: 'inactive',
        team_members: 0,
        next_billing_date: null,
        amount_per_member: memberPriceInCents,
        monthly_cost: 0
      });

      if (hasExistingSubscription) {
        toast.error("Unable to load subscription status");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionStatus();
  }, [user, companyId]);

  // Listen for billing-updated event (dispatched after Stripe checkout verification)
  useEffect(() => {
    const handler = () => {
      console.log('billing-updated event received, refreshing subscription status');
      fetchSubscriptionStatus();
    };
    window.addEventListener('billing-updated', handler);
    return () => window.removeEventListener('billing-updated', handler);
  }, []);

  if (isLoading || isPricingLoading) {
    return (
      <Card className="dashboard-card">
        <div className="card-header">
          <h2 className="card-title">Usage-Based Billing</h2>
        </div>
        <div className="p-6">
          <div className="animate-pulse">Loading subscription status...</div>
        </div>
      </Card>
    );
  }

  if (!subscriptionStatus) {
    return (
      <Card className="dashboard-card">
        <div className="card-header">
          <h2 className="card-title">Usage-Based Billing</h2>
        </div>
        <div className="p-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">Get Started</h4>
            <p className="text-sm text-blue-700 mb-4">
              Add your first team member to start your subscription.
            </p>
            <div className="text-sm text-blue-600">
              <p>• Pay only for active team members</p>
              <p>• Billing adjusts automatically each month</p>
              <p>• No upfront costs or slot limits</p>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </Badge>
        );
      case 'past_due':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Past Due
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge className="bg-red-100 text-red-800">Cancelled</Badge>
        );
      case 'inactive':
        return (
          <Badge className="bg-gray-100 text-gray-800">
            <Clock className="w-3 h-3 mr-1" />
            Inactive
          </Badge>
        );
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const monthlyTotal = subscriptionStatus.monthly_cost / 100;

  return (
    <Card className="dashboard-card">
      <div className="card-header">
        <h2 className="card-title">Usage-Based Billing</h2>
        <Button variant="outline" size="sm" onClick={fetchSubscriptionStatus}>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-600">Team Members</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {subscriptionStatus.team_members}
                </div>
              </div>

              <div className="bg-white border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-600">Per Member</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  ${(subscriptionStatus.amount_per_member / 100).toFixed(2)}
                </div>
              </div>

              <div className="bg-white border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-gray-600">Monthly Total</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  ${monthlyTotal.toFixed(2)}
                </div>
              </div>
            </div>

            {subscriptionStatus.next_billing_date && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Next billing: {new Date(subscriptionStatus.next_billing_date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            )}

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-800 mb-2">How It Works</h4>
              <div className="text-sm text-green-700 space-y-1">
                <p>• Your admin seat is always included</p>
                <p>• Team members are added with prorated billing</p>
                <p>• Seats adjust as members join or leave</p>
                <p>• Remove members anytime to reduce costs</p>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">Ready to Start</h4>
            <p className="text-sm text-blue-700 mb-4">
              Start your subscription to begin inviting team members.
            </p>
            <div className="text-sm text-blue-600">
              <p>• {"$"}{(memberPriceInCents / 100).toFixed(2)} per seat per month</p>
              <p>• Subscription starts with your admin seat</p>
              <p>• Team members are added with prorated billing</p>
              <p>• Apply a coupon at checkout for discounts</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};