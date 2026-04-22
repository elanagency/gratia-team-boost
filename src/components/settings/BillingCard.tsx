import React, { useState, useEffect, useCallback } from "react";
import { ExternalLink } from "lucide-react";
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
  environment: string | null;
  stripe_customer_id_test: string | null;
  stripe_customer_id_live: string | null;
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
  const [pendingCelebrationCharges, setPendingCelebrationCharges] = useState<{ total: number; count: number }>({ total: 0, count: 0 });
  const { user, companyId } = useAuth();
  const { memberPriceInCents, isLoading: isPricingLoading, isError: isPricingError } = usePlatformSettings();

  // Fetch pending celebration charges for next invoice
  useEffect(() => {
    if (!companyId) return;
    (async () => {
      const { data, error } = await supabase
        .from("celebration_rewards_log")
        .select("dollar_amount")
        .eq("company_id", companyId)
        .eq("billing_status", "pending");
      if (error) { console.error("Error fetching pending celebration charges:", error); return; }
      const total = (data || []).reduce((s, r: any) => s + (Number(r.dollar_amount) || 0), 0);
      setPendingCelebrationCharges({ total, count: data?.length || 0 });
    })();
  }, [companyId, subscriptionStatus]);

  const fetchCompanyData = async () => {
    if (!companyId) return null;
    const { data: company, error } = await supabase
      .from('companies')
      .select(`id, name, subscription_status, stripe_customer_id, stripe_subscription_id, environment, stripe_customer_id_test, stripe_customer_id_live`)
      .eq('id', companyId)
      .single();
    if (error) { console.error('Error fetching company data:', error); return null; }
    return company;
  };

  const fetchPaymentMethodDetails = useCallback(async () => {
    if (!hasBillingSetup) return;
    setIsLoadingPaymentMethod(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-payment-method-details');
      if (error) { console.error('Error fetching payment method details:', error); return; }
      if (data?.paymentMethod) setPaymentMethod(data.paymentMethod);
    } catch (error) { console.error('Error fetching payment method details:', error); }
    finally { setIsLoadingPaymentMethod(false); }
  }, [hasBillingSetup]);

  const fetchSubscriptionStatus = useCallback(async () => {
    if (!user || !companyId) return;
    setIsLoading(true);
    try {
      const company = await fetchCompanyData();
      if (!company) throw new Error('Company not found');
      setCompanyData(company);
      const environment = company?.environment || 'test';
      const stripeCustomerId = environment === 'live' ? company?.stripe_customer_id_live : company?.stripe_customer_id_test;
      const billingSetup = !!stripeCustomerId;
      setHasBillingSetup(billingSetup);
      const { count: memberCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('company_id', companyId).eq('status', 'active');
      const teamMembers = memberCount || 0;
      if (!memberPriceInCents) throw new Error('Platform pricing settings not available');
      const amountPerMember = memberPriceInCents;
      if (company?.stripe_subscription_id) {
        try {
          const { data: checkResult, error: checkError } = await supabase.functions.invoke('check-subscription-status');
          if (!checkError && checkResult) {
            setSubscriptionStatus({ has_subscription: checkResult.has_subscription, status: checkResult.status, team_members: teamMembers, next_billing_date: checkResult.next_billing_date, amount_per_member: amountPerMember, monthly_cost: amountPerMember * teamMembers });
            setHasExistingSubscription(true);
            return;
          }
        } catch (error) { console.log("check-subscription-status failed, using fallback data"); }
        setSubscriptionStatus({ has_subscription: true, status: company.subscription_status || 'active', team_members: teamMembers, next_billing_date: null, amount_per_member: amountPerMember, monthly_cost: amountPerMember * teamMembers });
        setHasExistingSubscription(true);
      } else {
        setSubscriptionStatus({ has_subscription: false, status: 'inactive', team_members: teamMembers, next_billing_date: null, amount_per_member: amountPerMember, monthly_cost: amountPerMember * teamMembers });
        setHasExistingSubscription(false);
      }
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      toast.error('Failed to fetch subscription status');
      setSubscriptionStatus(null);
      setHasExistingSubscription(false);
    } finally { setIsLoading(false); }
  }, [user, companyId, memberPriceInCents]);

  useEffect(() => { if (!isPricingLoading) fetchSubscriptionStatus(); }, [fetchSubscriptionStatus, isPricingLoading]);
  useEffect(() => { if (hasBillingSetup) fetchPaymentMethodDetails(); }, [fetchPaymentMethodDetails, hasBillingSetup]);
  useEffect(() => {
    const handler = () => { console.log('billing-updated event received'); fetchSubscriptionStatus(); };
    window.addEventListener('billing-updated', handler);
    return () => window.removeEventListener('billing-updated', handler);
  }, [fetchSubscriptionStatus]);
  useEffect(() => {
    if (!companyId) return;
    const ch = supabase.channel('billing-profiles-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `company_id=eq.${companyId}` }, () => { setTimeout(() => fetchSubscriptionStatus(), 1000); }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [companyId, fetchSubscriptionStatus]);
  useEffect(() => {
    if (!companyId) return;
    const ch = supabase.channel('billing-companies-changes').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'companies', filter: `id=eq.${companyId}` }, () => { setTimeout(() => fetchSubscriptionStatus(), 500); }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [companyId, fetchSubscriptionStatus]);

  const handleManageBilling = async () => {
    setIsPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.url) window.open(data.url, '_blank');
      else throw new Error('No portal URL received');
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast.error('Failed to open billing portal. Please try again.');
    } finally { setIsPortalLoading(false); }
  };

  const containerStyle: React.CSSProperties = {
    fontFamily: "Inter, sans-serif",
    border: "1px solid #E8E6F0",
    borderRadius: 15,
    padding: 20,
    background: "#fff",
  };

  const labelStyle: React.CSSProperties = { fontSize: 13, color: "#9996AA", fontFamily: "Inter, sans-serif" };
  const valueStyle: React.CSSProperties = { fontSize: 13, fontWeight: 500, color: "#0F0533", fontFamily: "Inter, sans-serif" };

  if (isLoading || isPricingLoading) {
    return (
      <div style={containerStyle}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: "#0F0533", marginBottom: 4 }}>Current Plan</h2>
        <p style={labelStyle}>Loading billing information...</p>
      </div>
    );
  }

  if (isPricingError || !memberPriceInCents) {
    return (
      <div style={containerStyle}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: "#0F0533", marginBottom: 4 }}>Current Plan</h2>
        <p style={{ fontSize: 13, color: "#E53E3E" }}>Error loading platform pricing settings. Please contact support.</p>
      </div>
    );
  }

  if (!subscriptionStatus) {
    return (
      <div style={containerStyle}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: "#0F0533", marginBottom: 4 }}>Current Plan</h2>
        <p style={{ fontSize: 13, color: "#E53E3E" }}>Error loading subscription data. Please refresh the page.</p>
      </div>
    );
  }

  const pricePerSeat = (memberPriceInCents / 100).toFixed(0);
  const seats = subscriptionStatus.team_members || 0;
  const totalCost = (seats * memberPriceInCents / 100).toFixed(2);
  const nextBillingDate = subscriptionStatus.next_billing_date
    ? new Date(subscriptionStatus.next_billing_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null;

  const paymentMethodText = hasBillingSetup
    ? isLoadingPaymentMethod
      ? "Loading..."
      : paymentMethod
        ? `${paymentMethod.brand?.charAt(0).toUpperCase()}${paymentMethod.brand?.slice(1)} ending in ${paymentMethod.last4}`
        : "Card on file"
    : "Not set";

  return (
    <div style={containerStyle}>
      {/* Header */}
      <h2 style={{ fontSize: 15, fontWeight: 600, color: "#0F0533", marginBottom: 2 }}>Current Plan</h2>
      <p style={{ ...labelStyle, marginBottom: 20 }}>Manage your subscription and billing</p>

      {/* Plan card */}
      <div
        style={{
          borderRadius: 13.375,
          border: "1px solid #E8E6F0",
          background: "linear-gradient(135deg, #F8F5FF 0%, #FFF 100%)",
          padding: "14px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: "#9996AA", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
            Current Plan
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#0F0533" }}>
            {hasExistingSubscription ? "Pro Plan" : "No Active Plan"}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: "#9996AA", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
            Price
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#0F0533" }}>
            ${pricePerSeat} <span style={{ fontSize: 12, fontWeight: 400, color: "#9996AA" }}>/seat/mo</span>
          </div>
        </div>
      </div>

      {/* Line items */}
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {/* Seats */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #F3F2F7" }}>
          <span style={labelStyle}>Seats</span>
          <span style={valueStyle}>
            {hasExistingSubscription ? `${seats} × $${pricePerSeat} = $${totalCost}` : "0"}
          </span>
        </div>

        {/* Total due */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #F3F2F7" }}>
          <span style={{ ...labelStyle, fontWeight: 500, color: "#7F2BFE" }}>
            Total due {nextBillingDate || ""}
          </span>
          <span style={{ ...valueStyle, fontWeight: 600 }}>
            {hasExistingSubscription ? `$${totalCost}` : "$0.00"}
          </span>
        </div>

        {/* Celebration charges (postpaid) */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #F3F2F7" }}>
          <span style={labelStyle}>
            Celebration charges{pendingCelebrationCharges.count > 0 ? ` (${pendingCelebrationCharges.count})` : ""}
          </span>
          <span style={valueStyle}>${pendingCelebrationCharges.total.toFixed(2)}</span>
        </div>

        {/* Next billing date */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #F3F2F7" }}>
          <span style={labelStyle}>Next billing date</span>
          <span style={valueStyle}>{nextBillingDate || "—"}</span>
        </div>

        {/* Payment method */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #F3F2F7" }}>
          <span style={labelStyle}>Payment method</span>
          <span style={valueStyle}>{paymentMethodText}</span>
        </div>
      </div>

      {/* Manage subscription */}
      <div style={{ marginTop: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: "#0F0533", marginBottom: 4 }}>Manage Your Subscription</h3>
        <p style={{ ...labelStyle, marginBottom: 16, lineHeight: 1.5 }}>
          View invoices, update payment methods, or cancel your subscription. Billing is based on active members only.
        </p>
        <button
          onClick={handleManageBilling}
          disabled={!hasExistingSubscription || isPortalLoading}
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 13,
            fontWeight: 500,
            height: 38,
            paddingLeft: 20,
            paddingRight: 20,
            borderRadius: 13.375,
            border: "none",
            background: hasExistingSubscription ? "linear-gradient(135deg, #7F2BFE, #FC5BFF)" : "#E8E6F0",
            color: hasExistingSubscription ? "#fff" : "#9996AA",
            cursor: hasExistingSubscription ? "pointer" : "not-allowed",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {isPortalLoading ? "Opening Portal..." : "Manage Billing"}
          <ExternalLink size={14} />
        </button>
      </div>
    </div>
  );
};
