
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
    console.log("[CREATE-SUBSCRIPTION-CHECKOUT] Getting company environment mode");
    const { data: company } = await supabaseAdmin
      .from('companies')
      .select('stripe_environment')
      .eq('id', companyId)
      .single();
    
    const environment = company?.stripe_environment || 'test'; // Default to test for safety
    console.log(`[CREATE-SUBSCRIPTION-CHECKOUT] Using company Stripe environment: ${environment}`);
    
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
    console.error(`[CREATE-SUBSCRIPTION-CHECKOUT] Error getting Stripe key, defaulting to test:`, error);
    // Fallback to test key for safety
    const testKey = Deno.env.get("STRIPE_SECRET_KEY_TEST");
    if (!testKey) throw new Error("STRIPE_SECRET_KEY_TEST not configured");
    return testKey;
  }
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyId, teamSlots, memberData, origin } = await req.json();

    if (!companyId || !teamSlots) {
      return new Response(
        JSON.stringify({ error: "Company ID and team slots are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[CREATE-SUBSCRIPTION-CHECKOUT] Creating checkout for:", { companyId, teamSlots, origin });

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
      console.error("[CREATE-SUBSCRIPTION-CHECKOUT] Company not found:", companyError);
      return new Response(
        JSON.stringify({ error: "Company not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let customerId = company.stripe_customer_id;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      console.log("[CREATE-SUBSCRIPTION-CHECKOUT] Creating new Stripe customer with email:", user.email);
      const customer = await stripe.customers.create({
        email: user.email, // Include email when creating customer
        metadata: {
          company_id: companyId,
          company_name: company.name,
        },
      });

      customerId = customer.id;
      console.log("[CREATE-SUBSCRIPTION-CHECKOUT] Created Stripe customer:", customerId);

      // Update company with customer ID
      await supabaseAdmin
        .from("companies")
        .update({ stripe_customer_id: customerId })
        .eq("id", companyId);
    } else {
      console.log("[CREATE-SUBSCRIPTION-CHECKOUT] Using existing Stripe customer:", customerId);
    }

    // Check if company already has an active subscription
    let existingSubscription = null;
    if (company.stripe_subscription_id) {
      try {
        existingSubscription = await stripe.subscriptions.retrieve(company.stripe_subscription_id);
        console.log("[CREATE-SUBSCRIPTION-CHECKOUT] Found existing subscription:", existingSubscription.id, "Status:", existingSubscription.status);
      } catch (error) {
        console.log("[CREATE-SUBSCRIPTION-CHECKOUT] Existing subscription not found or inactive:", error);
      }
    }

    // Get pricing from platform settings
    const { data: pricingSetting } = await supabaseAdmin
      .from('platform_settings')
      .select('value')
      .eq('key', 'member_monthly_price_cents')
      .single();
    
    const unitPrice = pricingSetting?.value ? parseInt(JSON.parse(pricingSetting.value)) : 299;

    console.log("[CREATE-SUBSCRIPTION-CHECKOUT] Pricing calculation:", {
      teamSlots,
      unitPrice,
      hasExistingSubscription: !!existingSubscription
    });

    // If we have an active subscription, update it instead of creating a new one
    if (existingSubscription && existingSubscription.status === 'active') {
      console.log("[CREATE-SUBSCRIPTION-CHECKOUT] Updating existing subscription quantity to:", teamSlots);
      
      // Update the subscription quantity
      const updatedSubscription = await stripe.subscriptions.update(existingSubscription.id, {
        items: [{
          id: existingSubscription.items.data[0].id,
          quantity: teamSlots,
        }],
        proration_behavior: 'always_invoice',
      });

      // Update company with new team slots
      await supabaseAdmin
        .from("companies")
        .update({ team_slots: teamSlots })
        .eq("id", companyId);

      // Log the subscription update
      await supabaseAdmin
        .from("subscription_events")
        .insert({
          company_id: companyId,
          event_type: "quantity_updated",
          previous_slots: company.team_slots || 0,
          new_slots: teamSlots,
          previous_quantity: existingSubscription.items.data[0].quantity,
          new_quantity: teamSlots,
          metadata: {
            subscription_id: updatedSubscription.id,
            updated_via: "direct_subscription_update"
          }
        });

      // Create pending member if provided
      if (memberData) {
        console.log("[CREATE-SUBSCRIPTION-CHECKOUT] Creating pending member after subscription update");
        await supabaseAdmin.functions.invoke('create-team-member', {
          body: memberData
        });
      }

      const baseUrl = origin || "http://localhost:3000";
      return new Response(
        JSON.stringify({
          success: true,
          message: "Subscription updated successfully",
          redirect_url: `${baseUrl}/dashboard/team?setup=success&updated=true`
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create new checkout session for new subscriptions
    const baseUrl = origin || "http://localhost:3000";
    
    // Prepare checkout session configuration
    const checkoutConfig: any = {
      customer: customerId,
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: unitPrice,
            recurring: {
              interval: "month",
            },
            product_data: {
              name: "Team Slots",
              description: `${teamSlots} team slots for your organization`,
            },
          },
          quantity: teamSlots,
        },
      ],
      metadata: {
        company_id: companyId,
        team_slots: teamSlots.toString(),
        ...(memberData ? { pending_member_data: JSON.stringify(memberData) } : {}),
      },
      success_url: `${baseUrl}/dashboard/team?setup=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/dashboard/team?setup=cancelled`,
      billing_address_collection: "required",
      allow_promotion_codes: true,
    };

    console.log("[CREATE-SUBSCRIPTION-CHECKOUT] Creating checkout session with config:", {
      customer: customerId,
      email_will_be_prepopulated: true,
      teamSlots,
      unitPrice
    });

    const session = await stripe.checkout.sessions.create(checkoutConfig);

    console.log("[CREATE-SUBSCRIPTION-CHECKOUT] Checkout session created:", session.id);

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
    console.error("[CREATE-SUBSCRIPTION-CHECKOUT] Error:", error);
    
    // Provide more specific error messages for common Stripe issues
    let errorMessage = "Internal server error";
    if (error instanceof Error) {
      if (error.message.includes("customer_email")) {
        errorMessage = "Customer email configuration error. Please try again.";
      } else if (error.message.includes("subscription")) {
        errorMessage = "Subscription configuration error. Please contact support.";
      } else {
        errorMessage = error.message;
      }
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
