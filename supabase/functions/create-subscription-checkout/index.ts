
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
    const { companyId, teamSlots, memberData, origin } = await req.json();

    if (!companyId || !teamSlots) {
      return new Response(
        JSON.stringify({ error: "Company ID and team slots are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[CREATE-SUBSCRIPTION-CHECKOUT] Creating checkout for:", { companyId, teamSlots, origin });

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

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
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
      console.log("[CREATE-SUBSCRIPTION-CHECKOUT] Creating new Stripe customer");
      const customer = await stripe.customers.create({
        metadata: {
          company_id: companyId,
          company_name: company.name,
        },
      });

      customerId = customer.id;

      // Update company with customer ID
      await supabaseAdmin
        .from("companies")
        .update({ stripe_customer_id: customerId })
        .eq("id", companyId);
    }

    // Calculate pricing - $2.99 per slot per month
    const unitPrice = 299; // $2.99 in cents
    const totalAmount = unitPrice * teamSlots;

    console.log("[CREATE-SUBSCRIPTION-CHECKOUT] Pricing calculation:", {
      teamSlots,
      unitPrice,
      totalAmount
    });

    // Create checkout session
    const baseUrl = origin || "http://localhost:3000";
    const session = await stripe.checkout.sessions.create({
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
    });

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
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
