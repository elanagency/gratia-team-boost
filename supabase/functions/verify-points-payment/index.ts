
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
    const { session_id } = await req.json();
    
    if (!session_id) {
      throw new Error("Session ID is required");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(session_id);
    
    if (session.payment_status !== 'paid') {
      throw new Error("Payment not completed");
    }

    // Use service role to update transaction and company balance
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get the transaction record
    const { data: transaction, error: transactionError } = await supabaseService
      .from('company_point_transactions')
      .select('*')
      .eq('stripe_session_id', session_id)
      .single();

    if (transactionError || !transaction) {
      throw new Error("Transaction not found");
    }

    if (transaction.payment_status === 'completed') {
      return new Response(
        JSON.stringify({ message: "Payment already processed" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Update transaction status and add payment intent ID
    const { error: updateTransactionError } = await supabaseService
      .from('company_point_transactions')
      .update({
        payment_status: 'completed',
        stripe_payment_intent_id: session.payment_intent as string,
      })
      .eq('stripe_session_id', session_id);

    if (updateTransactionError) {
      throw new Error("Failed to update transaction status");
    }

    // Update company points balance
    const { error: updateBalanceError } = await supabaseService
      .from('companies')
      .update({
        points_balance: transaction.amount
      })
      .eq('id', transaction.company_id)
      .select()
      .single();

    if (updateBalanceError) {
      console.error("Balance update error:", updateBalanceError);
      throw new Error("Failed to update company balance");
    }

    return new Response(
      JSON.stringify({ 
        message: "Payment verified and points added successfully",
        points_added: transaction.amount 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Payment verification error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
