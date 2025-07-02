
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

    // Use service role to update company balance and create transaction record
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Check if we already processed this session to avoid duplicates
    const { data: existingTransaction, error: existingError } = await supabaseService
      .from('company_point_transactions')
      .select('*')
      .eq('stripe_session_id', session_id)
      .single();

    if (existingTransaction) {
      return new Response(
        JSON.stringify({ message: "Payment already processed" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Extract data from session metadata
    const pointsAmount = parseInt(session.metadata.points_amount);
    const companyId = session.metadata.company_id;
    const userId = session.metadata.user_id;
    const stripeFee = parseInt(session.metadata.stripe_fee);
    const totalAmount = parseInt(session.metadata.total_amount);
    const exchangeRate = parseFloat(session.metadata.exchange_rate);

    // Create transaction record with completed status
    const { error: transactionError } = await supabaseService
      .from('company_point_transactions')
      .insert({
        company_id: companyId,
        amount: pointsAmount,
        description: `Stripe payment for ${pointsAmount} points at $${exchangeRate} per point`,
        created_by: userId,
        transaction_type: 'stripe_payment',
        stripe_session_id: session_id,
        stripe_payment_intent_id: session.payment_intent as string,
        stripe_fee: stripeFee,
        payment_status: 'completed',
        total_amount: totalAmount,
      });

    if (transactionError) {
      console.error("Transaction insert error:", transactionError);
      throw new Error("Failed to create transaction record");
    }

    // Update company points balance
    const { error: updateBalanceError } = await supabaseService
      .from('companies')
      .update({
        points_balance: supabaseService.raw(`points_balance + ${pointsAmount}`)
      })
      .eq('id', companyId);

    if (updateBalanceError) {
      console.error("Balance update error:", updateBalanceError);
      throw new Error("Failed to update company balance");
    }

    return new Response(
      JSON.stringify({ 
        message: "Payment verified and points added successfully",
        points_added: pointsAmount 
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
