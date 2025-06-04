
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyId, newQuantity } = await req.json();
    
    if (!companyId || newQuantity < 0) {
      throw new Error("Company ID and valid quantity required");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Use service role to access company data
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get company subscription details
    const { data: company, error: companyError } = await supabaseService
      .from('companies')
      .select('stripe_subscription_id, subscription_status')
      .eq('id', companyId)
      .single();

    if (companyError || !company || !company.stripe_subscription_id) {
      throw new Error("Company subscription not found");
    }

    // If quantity is 0, cancel the subscription
    if (newQuantity === 0) {
      await stripe.subscriptions.cancel(company.stripe_subscription_id);
      
      await supabaseService
        .from('companies')
        .update({
          subscription_status: 'cancelled',
          stripe_subscription_id: null,
        })
        .eq('id', companyId);

      await supabaseService
        .from('subscription_events')
        .insert({
          company_id: companyId,
          event_type: 'cancelled',
          new_quantity: 0,
          metadata: { reason: 'no_employees' },
        });

      return new Response(
        JSON.stringify({ message: "Subscription cancelled" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Get current subscription
    const subscription = await stripe.subscriptions.retrieve(company.stripe_subscription_id);
    const currentQuantity = subscription.items.data[0].quantity || 0;

    if (currentQuantity === newQuantity) {
      return new Response(
        JSON.stringify({ message: "Quantity unchanged" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Update subscription quantity
    const updatedSubscription = await stripe.subscriptions.update(
      company.stripe_subscription_id,
      {
        items: [
          {
            id: subscription.items.data[0].id,
            quantity: newQuantity,
          },
        ],
        proration_behavior: "always_invoice",
      }
    );

    // Get the latest invoice for amount charged
    const latestInvoice = await stripe.invoices.list({
      customer: subscription.customer as string,
      limit: 1,
    });

    const amountCharged = latestInvoice.data[0]?.amount_paid || 0;

    // Create subscription event record
    await supabaseService
      .from('subscription_events')
      .insert({
        company_id: companyId,
        event_type: 'quantity_updated',
        previous_quantity: currentQuantity,
        new_quantity: newQuantity,
        amount_charged: amountCharged,
        stripe_invoice_id: latestInvoice.data[0]?.id,
        metadata: {
          subscription_id: updatedSubscription.id,
          change_type: newQuantity > currentQuantity ? 'increase' : 'decrease',
        },
      });

    return new Response(
      JSON.stringify({
        message: "Subscription updated successfully",
        previous_quantity: currentQuantity,
        new_quantity: newQuantity,
        amount_charged: amountCharged,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Subscription update error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
