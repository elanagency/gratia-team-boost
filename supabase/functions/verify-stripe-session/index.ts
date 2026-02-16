
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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

    // Try to retrieve session - try both keys since we don't know the company yet
    let session;
    let stripe;
    const liveKey = Deno.env.get("STRIPE_SECRET_KEY_LIVE");
    const testKey = Deno.env.get("STRIPE_SECRET_KEY_TEST");
    
    try {
      const stripeLive = new Stripe(liveKey || "", { apiVersion: "2023-10-16" });
      session = await stripeLive.checkout.sessions.retrieve(sessionId);
      stripe = stripeLive;
    } catch {
      const stripeTest = new Stripe(testKey || "", { apiVersion: "2023-10-16" });
      session = await stripeTest.checkout.sessions.retrieve(sessionId);
      stripe = stripeTest;
    }

    const companyId = session.metadata?.company_id || session.metadata?.companyId;
    const pendingMemberData = session.metadata?.pending_member_data;

    if (!companyId) {
      return new Response(
        JSON.stringify({ error: "Invalid session metadata" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle subscription mode sessions (new billing flow)
    if (session.mode === 'subscription') {
      console.log("[VERIFY-STRIPE-SESSION] Processing subscription mode session");
      
      const subscriptionId = session.subscription as string;
      
      if (!subscriptionId) {
        return new Response(
          JSON.stringify({ error: "No subscription created" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Retrieve the subscription to get item ID
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const subscriptionItemId = subscription.items.data[0]?.id || null;

      // Update company with subscription details + billing_ready for backward compat
      const { error: updateError } = await supabaseAdmin
        .from('companies')
        .update({ 
          stripe_subscription_id: subscriptionId,
          stripe_subscription_item_id: subscriptionItemId,
          subscription_status: 'active',
          billing_ready: true,
          first_charge_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', companyId);

      if (updateError) {
        console.error("[VERIFY-STRIPE-SESSION] Error updating company:", updateError);
        throw updateError;
      }

      // Log subscription event
      await supabaseAdmin.from("subscription_events").insert({
        company_id: companyId,
        event_type: "subscription_created",
        new_quantity: 1,
        metadata: {
          subscription_id: subscriptionId,
          session_id: sessionId,
          trigger: 'initial_subscription_checkout',
        },
      });

      console.log("[VERIFY-STRIPE-SESSION] Subscription saved:", subscriptionId);

      // Create pending member if data exists
      let memberCreationResult = null;
      if (pendingMemberData) {
        try {
          const memberData = JSON.parse(pendingMemberData);
          console.log("[VERIFY-STRIPE-SESSION] Creating pending member:", memberData);

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

      return new Response(JSON.stringify({ 
        success: true, 
        type: 'subscription_created',
        companyId,
        subscriptionId,
        memberCreated: !!memberCreationResult,
        ...memberCreationResult
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Handle setup mode sessions (legacy billing setup flow)
    if (session.mode === 'setup') {
      console.log("[VERIFY-STRIPE-SESSION] Processing legacy setup mode session");
      
      const customerId = session.customer as string;
      const setupIntentId = session.setup_intent as string;

      try {
        const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
        const paymentMethodId = setupIntent.payment_method as string;

        if (paymentMethodId) {
          try {
            await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
          } catch (error) {
            console.log("[VERIFY-STRIPE-SESSION] Payment method already attached:", error);
          }

          await stripe.customers.update(customerId, {
            invoice_settings: { default_payment_method: paymentMethodId },
          });
        }

        await supabaseAdmin
          .from('companies')
          .update({ billing_ready: true, updated_at: new Date().toISOString() })
          .eq('id', companyId);

        return new Response(JSON.stringify({ 
          received: true, 
          type: 'setup_completed',
          companyId,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error("[VERIFY-STRIPE-SESSION] Error processing setup:", error);
        return new Response(
          JSON.stringify({ error: "Setup processing failed" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Handle celebration points purchase
    if (session.metadata?.purchase_type === "celebration_points") {
      console.log("[VERIFY-STRIPE-SESSION] Processing celebration points purchase");

      if (session.payment_status !== "paid") {
        return new Response(
          JSON.stringify({ error: "Payment not completed" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const pointsQuantity = parseInt(session.metadata.points_quantity || "0");
      if (pointsQuantity <= 0) {
        return new Response(
          JSON.stringify({ error: "Invalid points quantity" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: currentCompany } = await supabaseAdmin
        .from("companies")
        .select("points_balance")
        .eq("id", companyId)
        .single();

      const newBalance = (currentCompany?.points_balance || 0) + pointsQuantity;

      const { error: creditError } = await supabaseAdmin
        .from("companies")
        .update({ points_balance: newBalance, updated_at: new Date().toISOString() })
        .eq("id", companyId);

      if (creditError) {
        return new Response(
          JSON.stringify({ error: "Failed to credit points" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      await supabaseAdmin.from("subscription_events").insert({
        company_id: companyId,
        event_type: "points_purchase",
        new_quantity: pointsQuantity,
        amount_charged: session.amount_total || 0,
        metadata: { session_id: sessionId, points_quantity: pointsQuantity, new_balance: newBalance },
      });

      return new Response(
        JSON.stringify({ success: true, type: "points_purchase", pointsCredited: pointsQuantity, newBalance, companyId }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle other payment mode sessions
    if (session.payment_status !== "paid") {
      return new Response(
        JSON.stringify({ error: "Payment not completed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const subscriptionId = session.subscription as string;
    const amountTotal = session.amount_total || 0;

    const { error: updateError } = await supabaseAdmin
      .from("companies")
      .update({ stripe_subscription_id: subscriptionId, subscription_status: "active" })
      .eq("id", companyId);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: "Failed to update company subscription" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await supabaseAdmin.from("subscription_events").insert({
      company_id: companyId,
      event_type: "subscription_created",
      amount_charged: amountTotal,
      metadata: { subscription_id: subscriptionId, session_id: sessionId },
    });

    return new Response(
      JSON.stringify({ success: true, companyId, subscriptionId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[VERIFY-STRIPE-SESSION] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
