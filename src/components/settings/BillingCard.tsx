import React, { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Users, CreditCard, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { usePricing } from "@/hooks/usePricing";

interface SubscriptionStatus {
  has_subscription: boolean;
  status: string;
  team_members: number;
  next_billing_date: string | null;
  amount_per_member: number;
  monthly_cost: number;
}

interface PaymentMethodDetails {
  last4: string;
  brand: string;
  exp_month?: number;
  exp_year?: number;
  type: string;
}

interface CompanyData {
  id: string;
  name: string;
  subscription_status: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
}

export const BillingCard = () => {
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [hasExistingSubscription, setHasExistingSubscription] = useState(false);
  const [hasBillingSetup, setHasBillingSetup] = useState(false);
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodDetails | null>(null);
  const [isLoadingPaymentMethod, setIsLoadingPaymentMethod] = useState(false);
  const { user, companyId } = useAuth();
  const { pricePerMemberCents, isLoading: isPricingLoading } = usePricing();


  const fetchCompanyData = async () => {
    if (!companyId) return null;
    
    const { data: company, error } = await supabase
      .from('companies')
      .select(`
        id,
        name,
        subscription_status,
        stripe_customer_id,
        stripe_subscription_id
      `)
      .eq('id', companyId)
      .single();

    if (error) {
      console.error('Error fetching company data:', error);
      return null;
    }

    return company;
  };

  const fetchPaymentMethodDetails = useCallback(async () => {
    if (!hasBillingSetup) return;
    
    setIsLoadingPaymentMethod(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-payment-method-details');
      
      if (error) {
        console.error('Error fetching payment method details:', error);
        return;
      }
      
      if (data?.paymentMethod) {
        setPaymentMethod(data.paymentMethod);
      }
    } catch (error) {
      console.error('Error fetching payment method details:', error);
    } finally {
      setIsLoadingPaymentMethod(false);
    }
  }, [hasBillingSetup]);

  const fetchSubscriptionStatus = useCallback(async () => {
    if (!user || !companyId) return;

    setIsLoading(true);
    try {
      const company = await fetchCompanyData();
      if (!company) {
        throw new Error('Company not found');
      }
      
      setCompanyData(company);

      // Check if billing is set up (customer exists in Stripe)
      const billingSetup = !!(company?.stripe_customer_id);
      setHasBillingSetup(billingSetup);

      // Get active member count (only active members for billing)
      const { count: memberCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('is_admin', false)
        .eq('status', 'active');

      const teamMembers = memberCount || 0;
      
      // Use pricing from the dedicated hook (always up-to-date from platform settings)
      const amountPerMember = pricePerMemberCents;
      
      if (company?.stripe_subscription_id) {
        // Try to get subscription details from check-subscription-status
        try {
          const { data: checkResult, error: checkError } = await supabase.functions.invoke('check-subscription-status');
          
          if (!checkError && checkResult) {
            setSubscriptionStatus({
              has_subscription: checkResult.has_subscription,
              status: checkResult.status,
              team_members: teamMembers,
              next_billing_date: checkResult.next_billing_date,
              amount_per_member: amountPerMember,
              monthly_cost: amountPerMember * teamMembers
            });
            setHasExistingSubscription(true);
            return;
          }
        } catch (error) {
          console.log("check-subscription-status failed, using fallback data");
        }

        // Fallback: construct status from database
        setSubscriptionStatus({
          has_subscription: true,
          status: company.subscription_status || 'active',
          team_members: teamMembers,
          next_billing_date: null,
          amount_per_member: amountPerMember,
          monthly_cost: amountPerMember * teamMembers
        });
        setHasExistingSubscription(true);
      } else {
        // No subscription
        setSubscriptionStatus({
          has_subscription: false,
          status: 'inactive',
          team_members: 0,
          next_billing_date: null,
          amount_per_member: pricePerMemberCents,
          monthly_cost: 0
        });

        setHasExistingSubscription(false);
      }
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      toast.error('Failed to fetch subscription status');
      
      // Set fallback state
      setSubscriptionStatus({
        has_subscription: false,
        status: 'inactive',
        team_members: 0,
        next_billing_date: null,
        amount_per_member: pricePerMemberCents,
        monthly_cost: 0
      });
      setHasExistingSubscription(false);
    } finally {
      setIsLoading(false);
    }
  }, [user, companyId, pricePerMemberCents]);

  useEffect(() => {
    if (!isPricingLoading) {
      fetchSubscriptionStatus();
    }
  }, [fetchSubscriptionStatus, isPricingLoading]);

  useEffect(() => {
    if (hasBillingSetup) {
      fetchPaymentMethodDetails();
    }
  }, [fetchPaymentMethodDetails, hasBillingSetup]);

  const handleManageBilling = async () => {
    setIsPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) {
        throw error;
      }
      
      if (data?.url) {
        window.open(data.url, '_blank');
      } else {
        throw new Error('No portal URL received');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast.error('Failed to open billing portal. Please try again.');
    } finally {
      setIsPortalLoading(false);
    }
  };

  if (isLoading || isPricingLoading) {
    return (
      <Card className="dashboard-card">
        <div className="card-header">
          <h2 className="card-title">Billing Overview</h2>
        </div>
        <div className="p-6 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="dashboard-card">
      <div className="card-header">
        <h2 className="card-title">Billing Overview</h2>
      </div>
      
      <div className="p-6">

        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 ${!hasExistingSubscription ? 'opacity-50' : ''}`}>
          {/* Your Plan */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              Your plan
            </div>
            <div className="font-semibold">
              {hasExistingSubscription ? `Team Subscription` : 'No Active Plan'}
            </div>
            <div className="text-sm text-muted-foreground">
              ${(pricePerMemberCents / 100).toFixed(2)} per member/month
            </div>
          </div>

          {/* Active Members */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              Active members
            </div>
            <div className="font-semibold">
              {subscriptionStatus?.team_members || 0}
            </div>
            <div className="text-sm text-muted-foreground">
              {hasExistingSubscription ? 'Only active members billed' : 'Add members to start'}
            </div>
          </div>

          {/* Monthly Cost */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              Monthly cost
            </div>
            <div className="font-semibold">
              ${((subscriptionStatus?.monthly_cost || 0) / 100).toFixed(2)}
            </div>
            <div className="text-sm text-muted-foreground">
              {hasExistingSubscription ? 'Current billing' : 'No charges yet'}
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CreditCard className="h-4 w-4" />
              Payment method
            </div>
            <div className="font-semibold">
              {hasBillingSetup ? (
                isLoadingPaymentMethod ? (
                  'Loading...'
                ) : paymentMethod ? (
                  `${paymentMethod.brand?.charAt(0).toUpperCase()}${paymentMethod.brand?.slice(1)} ending in ${paymentMethod.last4}`
                ) : (
                  'Card ending in ****'
                )
              ) : (
                'Not set'
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {hasBillingSetup ? 'Managed via Stripe' : 'Set up billing to view'}
            </div>
          </div>
        </div>

        {/* Manage Button */}
        <div className="border-t pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-medium">{hasExistingSubscription ? 'Manage Your Subscription' : 'Setup Your Billing'}</h3>
              <p className="text-sm text-muted-foreground">
                {hasExistingSubscription 
                  ? 'View invoices, update payment methods, or cancel your subscription. Billing is based on active members only.'
                  : 'Set up your billing information to start inviting team members and managing your subscription.'
                }
              </p>
            </div>
            <Button 
              onClick={handleManageBilling}
              disabled={!hasExistingSubscription || isPortalLoading}
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              {isPortalLoading ? 'Opening Portal...' : hasExistingSubscription ? 'Manage Billing' : 'No Active Subscription'}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};