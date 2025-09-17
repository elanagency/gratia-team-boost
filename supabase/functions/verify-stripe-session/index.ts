
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Helper function to get the appropriate Stripe key based on environment mode
const getStripeKey = async (supabaseAdmin: any): Promise<string> => {
  try {
    console.log("[VERIFY-STRIPE-SESSION] Getting environment mode from platform settings");
    const { data: envSetting } = await supabaseAdmin
      .from('platform_settings')
      .select('value')
      .eq('key', 'environment_mode')
      .single();
    
    const environment = envSetting?.value || 'test'; // Default to test for safety
    console.log(`[VERIFY-STRIPE-SESSION] Using Stripe environment: ${environment}`);
    
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
    console.error(`[VERIFY-STRIPE-SESSION] Error getting Stripe key, defaulting to test:`, error);
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
    const { sessionId } = await req.json();

    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: "Session ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[VERIFY-STRIPE-SESSION] Verifying session:", sessionId);

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

    const stripeKey = await getStripeKey(supabaseAdmin);
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return new Response(
        JSON.stringify({ error: "Payment not completed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const companyId = session.metadata?.company_id || session.metadata?.companyId;
    const pendingMemberData = session.metadata?.pending_member_data;

    if (!companyId) {
      return new Response(
        JSON.stringify({ error: "Invalid session metadata" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle setup mode sessions (billing setup)
    if (session.mode === 'setup') {
      console.log("[VERIFY-STRIPE-SESSION] Processing setup mode session for billing setup");
      
      const customerId = session.customer as string;
      const setupIntentId = session.setup_intent as string;
      const environment = session.metadata?.environment || 'live';

      try {
        // Retrieve setup intent to get payment method
        const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
        const paymentMethodId = setupIntent.payment_method as string;

        if (paymentMethodId) {
          // Attach payment method to customer if not already attached
          try {
            await stripe.paymentMethods.attach(paymentMethodId, {
              customer: customerId,
            });
          } catch (error) {
            // Payment method might already be attached
            console.log("[VERIFY-STRIPE-SESSION] Payment method already attached or error:", error);
          }

          // Set as default payment method
          await stripe.customers.update(customerId, {
            invoice_settings: {
              default_payment_method: paymentMethodId,
            },
          });

          console.log("[VERIFY-STRIPE-SESSION] Payment method attached and set as default");
        }

        // Mark billing as ready
        const { error: updateError } = await supabaseAdmin
          .from('companies')
          .update({ 
            billing_ready: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', companyId);

        if (updateError) {
          console.error("[VERIFY-STRIPE-SESSION] Error updating billing_ready:", updateError);
          throw updateError;
        }

        console.log("[VERIFY-STRIPE-SESSION] Company billing marked as ready");

        return new Response(JSON.stringify({ 
          received: true, 
          type: 'setup_completed',
          companyId 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        console.error("[VERIFY-STRIPE-SESSION] Error processing setup session:", error);
        return new Response(
          JSON.stringify({ error: "Setup processing failed" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Handle payment mode sessions (existing subscription flow)
    if (session.payment_status !== "paid") {
      return new Response(
        JSON.stringify({ error: "Payment not completed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[VERIFY-STRIPE-SESSION] Processing:", { companyId, hasPendingMember: !!pendingMemberData });

    // Get the subscription from the session
    const subscriptionId = session.subscription as string;
    
    // Get the amount charged from the session
    const amountTotal = session.amount_total || 0; // in cents
    console.log("[VERIFY-STRIPE-SESSION] Amount charged:", amountTotal);
    
    // Update company with subscription information
    const { error: updateError } = await supabaseAdmin
      .from("companies")
      .update({
        stripe_subscription_id: subscriptionId,
        subscription_status: "active",
      })
      .eq("id", companyId);

    if (updateError) {
      console.error("[VERIFY-STRIPE-SESSION] Error updating company:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update company subscription" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get current team member count for subscription event
    const { data: memberCount } = await supabaseAdmin
      .from("profiles")
      .select("id", { count: "exact" })
      .eq("company_id", companyId)
      .eq("is_admin", false)
      .eq("status", "active");

    const currentMembers = memberCount?.length || 0;

    // Log the subscription event
    const { error: eventError } = await supabaseAdmin
      .from("subscription_events")
      .insert({
        company_id: companyId,
        event_type: "subscription_created",
        new_quantity: currentMembers,
        amount_charged: amountTotal,
        metadata: {
          subscription_id: subscriptionId,
          session_id: sessionId,
          initial_member_count: currentMembers,
        },
      });

    if (eventError) {
      console.error("[VERIFY-STRIPE-SESSION] Error logging subscription event:", eventError);
    }

    let memberCreationResult = null;

    // If there's pending member data, create the member now
    if (pendingMemberData) {
      try {
        const memberData = JSON.parse(pendingMemberData);
        console.log("[VERIFY-STRIPE-SESSION] Creating pending member:", memberData);

        // Call create-team-member function
        const memberResponse = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/create-team-member`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            'apikey': Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
          },
          body: JSON.stringify(memberData)
        });

        if (memberResponse.ok) {
          memberCreationResult = await memberResponse.json();
          console.log("[VERIFY-STRIPE-SESSION] Member created successfully");
        } else {
          const errorText = await memberResponse.text();
          console.error("[VERIFY-STRIPE-SESSION] Failed to create member:", errorText);
        }
      } catch (memberError) {
        console.error("[VERIFY-STRIPE-SESSION] Error creating pending member:", memberError);
      }
    }

    console.log("[VERIFY-STRIPE-SESSION] Verification completed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        companyId,
        subscriptionId,
        memberCreated: !!memberCreationResult,
        ...memberCreationResult,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[VERIFY-STRIPE-SESSION] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
