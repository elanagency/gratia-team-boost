
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION-STATUS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Use service role to access company data
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseService.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.id) throw new Error("User not authenticated");

    logStep("User authenticated", { userId: user.id });

    // Get user's company
    const { data: memberData, error: memberError } = await supabaseService
      .from('company_members')
      .select('company_id, is_admin')
      .eq('user_id', user.id)
      .eq('is_admin', true)
      .single();

    if (memberError || !memberData) {
      logStep("User is not a company admin", { memberError });
      return new Response(
        JSON.stringify({
          has_subscription: false,
          status: "inactive",
          current_quantity: 0,
          member_count: 0,
          next_billing_date: null,
          amount_per_member: 299,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const companyId = memberData.company_id;
    logStep("Company found", { companyId });

    // Get company details including subscription info
    const { data: company, error: companyError } = await supabaseService
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      throw new Error("Company not found");
    }

    logStep("Company data retrieved", { 
      companyName: company.name,
      subscriptionId: company.stripe_subscription_id 
    });

    // Count non-admin members
    const { data: members, error: membersError } = await supabaseService
      .from('company_members')
      .select('id')
      .eq('company_id', companyId)
      .eq('is_admin', false);

    if (membersError) {
      console.error("Error counting members:", membersError);
    }

    const memberCount = members?.length || 0;
    logStep("Member count retrieved", { memberCount });

    // If no subscription ID, return no subscription
    if (!company.stripe_subscription_id) {
      logStep("No subscription found");
      return new Response(
        JSON.stringify({
          has_subscription: false,
          status: "inactive",
          current_quantity: 0,
          member_count: memberCount,
          next_billing_date: null,
          amount_per_member: 299,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Check subscription status with Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    logStep("Fetching subscription from Stripe", { subscriptionId: company.stripe_subscription_id });
    
    const subscription = await stripe.subscriptions.retrieve(company.stripe_subscription_id);
    
    logStep("Subscription retrieved from Stripe", {
      status: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
      quantity: subscription.items.data[0]?.quantity || 0
    });

    // Update company subscription status
    await supabaseService
      .from('companies')
      .update({ subscription_status: subscription.status })
      .eq('id', companyId);

    const nextBillingDate = new Date(subscription.current_period_end * 1000).toISOString();
    const currentQuantity = subscription.items.data[0]?.quantity || 0;

    return new Response(
      JSON.stringify({
        has_subscription: subscription.status === 'active',
        status: subscription.status,
        current_quantity: currentQuantity,
        member_count: memberCount,
        next_billing_date: nextBillingDate,
        amount_per_member: 299,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription-status", { error: errorMessage });
    console.error("Subscription status check error:", error);
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        has_subscription: false,
        status: "error",
        current_quantity: 0,
        member_count: 0,
        next_billing_date: null,
        amount_per_member: 299,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
