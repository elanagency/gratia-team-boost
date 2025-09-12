import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper function to get the appropriate Stripe key based on company environment
const getStripeKey = async (supabaseClient: any, companyId: string): Promise<string> => {
  try {
    console.log("[CUSTOMER-PORTAL] Getting company environment mode");
    const { data: company } = await supabaseClient
      .from('companies')
      .select('environment')
      .eq('id', companyId)
      .single();
    
    const environment = company?.environment || 'live'; // Default to live
    console.log(`[CUSTOMER-PORTAL] Using company environment: ${environment}`);
    
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
    console.error(`[CUSTOMER-PORTAL] Error getting Stripe key, defaulting to live:`, error);
    // Fallback to live key 
    const liveKey = Deno.env.get("STRIPE_SECRET_KEY_LIVE");
    if (!liveKey) throw new Error("STRIPE_SECRET_KEY_LIVE not configured");
    return liveKey;
  }
};

// Helper logging function for debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CUSTOMER-PORTAL] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Initialize Supabase client with the service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    // Extract the JWT token from the Authorization header
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      logStep("User authentication failed", { error: userError });
      throw new Error(`Authentication error: ${userError?.message}`);
    }
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get user's company and stripe customer ID from profiles table
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select(`
        company_id,
        companies (
          stripe_customer_id,
          stripe_customer_id_live,
          stripe_customer_id_test,
          environment,
          name
        )
      `)
      .eq('id', user.id)
      .single();

    if (profileError || !profile || !profile.company_id) {
      throw new Error("User is not a member of any company");
    }

    const company = profile.companies as any;
    
    // Get environment-specific customer ID
    const customerId = company.environment === 'live' ? company.stripe_customer_id_live : company.stripe_customer_id_test;
    
    if (!customerId) {
      throw new Error(`No Stripe customer found for this company in ${company.environment} mode`);
    }

    logStep("Found company with Stripe customer", { 
      companyName: company.name, 
      customerId: customerId,
      environment: company.environment
    });

    const stripeKey = await getStripeKey(supabaseClient, profile.company_id);
    logStep("Stripe key retrieved and verified");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const origin = req.headers.get("origin") || "https://kbjcjtycmfdjfnduxiud.supabase.co";
    
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/dashboard/settings`,
    });
    
    logStep("Customer portal session created", { 
      sessionId: portalSession.id, 
      url: portalSession.url 
    });

    return new Response(JSON.stringify({ url: portalSession.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in customer-portal", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});