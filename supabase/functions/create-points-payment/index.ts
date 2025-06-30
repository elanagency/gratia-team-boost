
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
    const { pointsToAdd } = await req.json();
    
    if (!pointsToAdd || pointsToAdd <= 0) {
      throw new Error("Invalid points amount");
    }

    // Create Supabase client for user authentication
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Authentication required");
    }

    // Create Supabase service client to get platform settings
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get current point exchange rate from platform settings
    const { data: exchangeRateData, error: exchangeRateError } = await supabaseService
      .from('platform_settings')
      .select('value')
      .eq('key', 'point_exchange_rate')
      .single();

    if (exchangeRateError) {
      console.error('Error fetching exchange rate:', exchangeRateError);
      throw new Error("Failed to get current exchange rate");
    }

    const exchangeRate = parseFloat(JSON.parse(exchangeRateData.value));
    console.log('Current exchange rate:', exchangeRate);

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Calculate costs using configurable exchange rate (convert to cents)
    const pointsCost = Math.round(pointsToAdd * exchangeRate * 100); // Convert to cents
    const stripeFee = Math.round(pointsCost * 0.029) + 30; // 2.9% + $0.30
    const totalAmount = pointsCost + stripeFee;

    console.log('Pricing breakdown:', {
      pointsToAdd,
      exchangeRate,
      pointsCostCents: pointsCost,
      stripeFee,
      totalAmount
    });

    // Get user's company ID for session metadata
    const { data: memberData, error: memberError } = await supabaseService
      .from('company_members')
      .select('company_id')
      .eq('user_id', user.id)
      .single();

    if (memberError || !memberData) {
      throw new Error("User is not a member of any company");
    }

    // Create Stripe checkout session with all necessary metadata
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Company Points (${pointsToAdd} points)`,
              description: `Add ${pointsToAdd} points to your company balance at $${exchangeRate} per point`,
            },
            unit_amount: totalAmount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/dashboard/settings?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/dashboard/settings?payment=cancelled`,
      metadata: {
        points_amount: pointsToAdd.toString(),
        user_id: user.id,
        company_id: memberData.company_id,
        points_cost: pointsCost.toString(),
        stripe_fee: stripeFee.toString(),
        exchange_rate: exchangeRate.toString(),
        total_amount: totalAmount.toString(),
      },
    });

    // DO NOT create transaction record here - only create after payment is verified

    return new Response(
      JSON.stringify({ 
        url: session.url,
        session_id: session.id,
        breakdown: {
          points_cost: pointsCost,
          stripe_fee: stripeFee,
          total_amount: totalAmount,
          exchange_rate: exchangeRate
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Payment creation error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
