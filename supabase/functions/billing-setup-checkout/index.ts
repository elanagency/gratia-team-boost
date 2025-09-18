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
    
    const environment = company?.environment || 'live'; // Default to live
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
    // Fallback to live key 
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

    console.log("[BILLING-SETUP-CHECKOUT] Setting up billing for:", { companyId, origin });

    // Get authenticated user for email prepopulation
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

    // Get environment-specific customer ID
    const customerIdField = company.environment === 'live' ? 'stripe_customer_id_live' : 'stripe_customer_id_test';
    let customerId = company.environment === 'live' ? company.stripe_customer_id_live : company.stripe_customer_id_test;

    // Create Stripe customer if doesn't exist for this environment
    if (!customerId) {
      console.log("[BILLING-SETUP-CHECKOUT] Creating new Stripe customer with email:", user.email, "for environment:", company.environment);
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

      // Update company with environment-specific customer ID
      const updateData = { [customerIdField]: customerId };
      await supabaseAdmin
        .from("companies")
        .update(updateData)
        .eq("id", companyId);
    } else {
      console.log("[BILLING-SETUP-CHECKOUT] Using existing Stripe customer:", customerId, "for environment:", company.environment);
    }

    // Create setup checkout session - just to collect payment method, no payment
    const baseUrl = origin || "http://localhost:3000";
    
    const checkoutConfig: any = {
      customer: customerId,
      payment_method_types: ["card"],
      mode: "setup", // This only collects payment method, no payment
      metadata: {
        company_id: companyId,
        setup_type: "billing_method",
        ...(memberData ? { pending_member_data: JSON.stringify(memberData) } : {}),
      },
      success_url: `${baseUrl}/dashboard/settings?setup=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/dashboard/settings?setup=cancelled`,
    };

    console.log("[BILLING-SETUP-CHECKOUT] Creating setup session with config:", {
      customer: customerId,
      mode: "setup",
      companyId
    });

    const session = await stripe.checkout.sessions.create(checkoutConfig);

    console.log("[BILLING-SETUP-CHECKOUT] Setup session created:", session.id);

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