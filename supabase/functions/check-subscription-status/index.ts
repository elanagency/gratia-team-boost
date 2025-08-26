
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("[CHECK-SUBSCRIPTION-STATUS] No Authorization header");
      return new Response(
        JSON.stringify({ error: "Authorization header required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[CHECK-SUBSCRIPTION-STATUS] Starting function execution");

    // Initialize the Supabase client with service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Initialize regular client for user operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_ANON_KEY") || "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get the user from the authorization header
    console.log("[CHECK-SUBSCRIPTION-STATUS] Getting user from auth header");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error("[CHECK-SUBSCRIPTION-STATUS] User auth error:", userError);
      return new Response(
        JSON.stringify({ error: "User not authenticated", details: userError?.message }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[CHECK-SUBSCRIPTION-STATUS] Authenticated user:", user.id);

    // Get user's company membership
    console.log("[CHECK-SUBSCRIPTION-STATUS] Fetching company membership");
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from("company_members")
      .select("company_id, is_admin")
      .eq("user_id", user.id)
      .eq("is_admin", true)
      .single();

    if (membershipError) {
      console.error("[CHECK-SUBSCRIPTION-STATUS] Membership error:", membershipError);
      
      // Check if the user is a member of any company (not necessarily admin)
      const { data: nonAdminMembership, error: nonAdminError } = await supabaseAdmin
        .from("company_members")
        .select("company_id")
        .eq("user_id", user.id)
        .single();
        
      if (nonAdminError || !nonAdminMembership) {
        console.error("[CHECK-SUBSCRIPTION-STATUS] No company membership found");
        return new Response(
          JSON.stringify({ error: "Company membership not found" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Non-admin user, return limited information
      console.log("[CHECK-SUBSCRIPTION-STATUS] Non-admin user, returning limited info");
      const { data: usedSlots } = await supabaseAdmin
        .rpc('get_used_team_slots', { company_id: nonAdminMembership.company_id });
      
      const currentUsedSlots = usedSlots || 0;
      
      return new Response(
        JSON.stringify({
          has_subscription: false,
          status: 'team_member',
          team_slots: 0,
          used_slots: currentUsedSlots,
          available_slots: 0,
          next_billing_date: null,
      amount_per_slot: 299, // Will be updated below
          slot_utilization: 0,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const companyId = membership.company_id;
    console.log("[CHECK-SUBSCRIPTION-STATUS] Company ID:", companyId);

    // Get company info with subscription status
    console.log("[CHECK-SUBSCRIPTION-STATUS] Fetching company data");
    const { data: company, error: companyError } = await supabaseAdmin
      .from("companies")
      .select("team_slots, subscription_status, stripe_subscription_id")
      .eq("id", companyId)
      .single();

    if (companyError) {
      console.error("[CHECK-SUBSCRIPTION-STATUS] Error fetching company:", companyError);
      // Return default values for new companies
      const { data: usedSlots } = await supabaseAdmin
        .rpc('get_used_team_slots', { company_id: companyId });
      
      const currentUsedSlots = usedSlots || 0;
      
      return new Response(
        JSON.stringify({
          has_subscription: false,
          status: 'inactive',
          team_slots: 0,
          used_slots: currentUsedSlots,
          available_slots: 0,
          next_billing_date: null,
      amount_per_slot: 299, // Will be updated below
          slot_utilization: 0,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("[CHECK-SUBSCRIPTION-STATUS] Company data:", {
      teamSlots: company.team_slots,
      subscriptionStatus: company.subscription_status,
      hasStripeId: !!company.stripe_subscription_id
    });

    // Get current used slots
    const { data: usedSlots, error: slotsError } = await supabaseAdmin
      .rpc('get_used_team_slots', { company_id: companyId });

    if (slotsError) {
      console.error("[CHECK-SUBSCRIPTION-STATUS] Error getting used slots:", slotsError);
    }

    const currentUsedSlots = usedSlots || 0;
    const availableSlots = company.team_slots || 0;

    let subscriptionDetails = null;
    if (company.stripe_subscription_id) {
      try {
        console.log("[CHECK-SUBSCRIPTION-STATUS] Fetching Stripe subscription details");
        const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
        if (!stripeKey) {
          console.error("[CHECK-SUBSCRIPTION-STATUS] Missing Stripe secret key");
          throw new Error("Stripe secret key not configured");
        }

        const stripe = new Stripe(stripeKey, {
          apiVersion: "2023-10-16",
        });

        const subscription = await stripe.subscriptions.retrieve(company.stripe_subscription_id);
        
        subscriptionDetails = {
          current_period_end: subscription.current_period_end,
          status: subscription.status,
          quantity: subscription.items.data[0]?.quantity || 0,
        };

        console.log("[CHECK-SUBSCRIPTION-STATUS] Retrieved subscription details:", {
          id: subscription.id,
          status: subscription.status,
          quantity: subscriptionDetails.quantity
        });
      } catch (stripeError) {
        console.error("[CHECK-SUBSCRIPTION-STATUS] Error fetching Stripe subscription:", stripeError);
        
        // If Stripe call fails but we have database info, use database values
        console.log("[CHECK-SUBSCRIPTION-STATUS] Falling back to database values due to Stripe error");
        subscriptionDetails = {
          current_period_end: null,
          status: company.subscription_status,
          quantity: company.team_slots,
        };
      }
    }

    // Get pricing from platform settings
    const { data: pricingSetting } = await supabaseAdmin
      .from('platform_settings')
      .select('value')
      .eq('key', 'member_monthly_price_cents')
      .single();
    
    const unitPrice = pricingSetting?.value ? parseInt(JSON.parse(pricingSetting.value)) : 299;

    const response = {
      has_subscription: !!company.stripe_subscription_id,
      status: subscriptionDetails?.status || company.subscription_status || 'inactive',
      team_slots: availableSlots,
      used_slots: currentUsedSlots,
      available_slots: Math.max(0, availableSlots - currentUsedSlots),
      next_billing_date: subscriptionDetails?.current_period_end 
        ? new Date(subscriptionDetails.current_period_end * 1000).toISOString()
        : null,
      amount_per_slot: unitPrice,
      slot_utilization: availableSlots > 0 ? Math.round((currentUsedSlots / availableSlots) * 100) : 0,
    };

    console.log("[CHECK-SUBSCRIPTION-STATUS] Sending response:", response);

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[CHECK-SUBSCRIPTION-STATUS] Unexpected error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error", 
        details: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
