import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Helper function to get the appropriate Stripe key based on company environment
const getStripeKey = async (supabaseAdmin: any, companyId: string): Promise<string> => {
  try {
    console.log("[BILLING-SETUP-CHECKOUT] Getting company environment mode");
    const { data: company } = await supabaseAdmin
      .from('companies')
      .select('environment')
      .eq('id', companyId)
      .single();
    
    const environment = company?.environment || 'live';
    console.log(`[BILLING-SETUP-CHECKOUT] Using company environment: ${environment}`);
    
    if (environment === 'live') {
      const liveKey = Deno.env.get("STRIPE_SECRET_KEY_LIVE");
      if (!liveKey) throw new Error("STRIPE_SECRET_KEY_LIVE not configured");
      return liveKey;
    } else {
      const testKey = Deno.env.get("STRIPE_SECRET_KEY_TEST");
      if (!testKey) throw new Error("STRIPE_SECRET_KEY_TEST not configured");
      return testKey;
    }
  } catch (error) {
    console.error(`[BILLING-SETUP-CHECKOUT] Error getting Stripe key, defaulting to live:`, error);
    const liveKey = Deno.env.get("STRIPE_SECRET_KEY_LIVE");
    if (!liveKey) throw new Error("STRIPE_SECRET_KEY_LIVE not configured");
    return liveKey;
  }
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyId, memberData, origin } = await req.json();

    if (!companyId) {
      return new Response(
        JSON.stringify({ error: "Company ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[BILLING-SETUP-CHECKOUT] Setting up subscription for:", { companyId, origin });

    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_ANON_KEY") || ""
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    const stripeKey = await getStripeKey(supabaseAdmin, companyId);
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    // Get company information
    const { data: company, error: companyError } = await supabaseAdmin
      .from("companies")
      .select("*")
      .eq("id", companyId)
      .single();

    if (companyError || !company) {
      console.error("[BILLING-SETUP-CHECKOUT] Company not found:", companyError);
      return new Response(
        JSON.stringify({ error: "Company not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If company already has a subscription, skip checkout
    if (company.stripe_subscription_id) {
      console.log("[BILLING-SETUP-CHECKOUT] Company already has subscription:", company.stripe_subscription_id);
      return new Response(
        JSON.stringify({ 
          alreadySubscribed: true,
          subscriptionId: company.stripe_subscription_id 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get environment-specific customer ID
    const isLive = (company.environment || 'live') === 'live';
    const customerIdField = isLive ? 'stripe_customer_id_live' : 'stripe_customer_id_test';
    let customerId = isLive ? company.stripe_customer_id_live : company.stripe_customer_id_test;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      console.log("[BILLING-SETUP-CHECKOUT] Creating new Stripe customer for environment:", company.environment);
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          company_id: companyId,
          company_name: company.name,
          environment: company.environment
        },
      });

      customerId = customer.id;
      console.log("[BILLING-SETUP-CHECKOUT] Created Stripe customer:", customerId);

      const updateData = { [customerIdField]: customerId };
      await supabaseAdmin
        .from("companies")
        .update(updateData)
        .eq("id", companyId);
    }

    // Get the platform price ID for subscription
    const priceIdField = isLive ? 'stripe_price_id_live' : 'stripe_price_id_test';
    const { data: settingsData } = await supabaseAdmin
      .from('platform_settings')
      .select(`${priceIdField}`)
      .eq('key', 'platform_settings')
      .single();

    const priceId = settingsData?.[priceIdField as keyof typeof settingsData];
    
    if (!priceId) {
      console.error("[BILLING-SETUP-CHECKOUT] No price ID found for environment");
      return new Response(
        JSON.stringify({ error: "Platform pricing not configured. Please contact support." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create subscription checkout session (not setup mode)
    const baseUrl = origin || "http://localhost:3000";
    
    const checkoutConfig: any = {
      customer: customerId,
      mode: "subscription",
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      allow_promotion_codes: true,
      metadata: {
        company_id: companyId,
        setup_type: "initial_subscription",
        ...(memberData ? { pending_member_data: JSON.stringify(memberData) } : {}),
      },
      subscription_data: {
        metadata: {
          company_id: companyId,
          environment: company.environment || 'live',
        },
      },
      success_url: `${baseUrl}/dashboard/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/dashboard/settings?tab=billing`,
    };

    console.log("[BILLING-SETUP-CHECKOUT] Creating subscription checkout with config:", {
      customer: customerId,
      mode: "subscription",
      quantity: 1,
      priceId,
      companyId
    });

    const session = await stripe.checkout.sessions.create(checkoutConfig);

    console.log("[BILLING-SETUP-CHECKOUT] Checkout session created:", session.id);

    return new Response(
      JSON.stringify({
        url: session.url,
        sessionId: session.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[BILLING-SETUP-CHECKOUT] Error:", error);
    
    let errorMessage = "Internal server error";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
