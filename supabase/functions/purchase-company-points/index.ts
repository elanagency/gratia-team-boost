import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const getStripeKey = async (supabaseAdmin: any, companyId: string): Promise<{ key: string; environment: string }> => {
  const { data: company } = await supabaseAdmin
    .from("companies")
    .select("environment")
    .eq("id", companyId)
    .single();

  const environment = company?.environment || "live";

  if (environment === "live") {
    const liveKey = Deno.env.get("STRIPE_SECRET_KEY_LIVE");
    if (!liveKey) throw new Error("STRIPE_SECRET_KEY_LIVE not configured");
    return { key: liveKey, environment };
  } else {
    const testKey = Deno.env.get("STRIPE_SECRET_KEY_TEST");
    if (!testKey) throw new Error("STRIPE_SECRET_KEY_TEST not configured");
    return { key: testKey, environment };
  }
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyId, pointsQuantity, origin } = await req.json();

    if (!companyId || !pointsQuantity || pointsQuantity < 100) {
      return new Response(
        JSON.stringify({ error: "companyId and pointsQuantity (min 100) are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[PURCHASE-POINTS] Starting:", { companyId, pointsQuantity });

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
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
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify user is admin of this company
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("is_admin, company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin || profile.company_id !== companyId) {
      return new Response(
        JSON.stringify({ error: "Only company admins can purchase points" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Stripe key and environment
    const { key: stripeKey, environment } = await getStripeKey(supabaseAdmin, companyId);
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Get company info for customer
    const { data: company } = await supabaseAdmin
      .from("companies")
      .select("*")
      .eq("id", companyId)
      .single();

    if (!company) {
      return new Response(
        JSON.stringify({ error: "Company not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get or create Stripe customer
    const customerIdField = environment === "live" ? "stripe_customer_id_live" : "stripe_customer_id_test";
    let customerId = environment === "live" ? company.stripe_customer_id_live : company.stripe_customer_id_test;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { company_id: companyId, company_name: company.name, environment },
      });
      customerId = customer.id;
      await supabaseAdmin.from("companies").update({ [customerIdField]: customerId }).eq("id", companyId);
      console.log("[PURCHASE-POINTS] Created Stripe customer:", customerId);
    }

    // Get point_exchange_rate from platform_settings
    const { data: platformSettings } = await supabaseAdmin
      .from("platform_settings")
      .select("point_exchange_rate, stripe_celebration_product_id_live, stripe_celebration_product_id_test")
      .eq("key", "platform_settings")
      .single();

    const exchangeRate = platformSettings?.point_exchange_rate || 0.05;
    const pricePerPointCents = Math.round(exchangeRate * 100); // e.g. 0.05 -> 5 cents

    console.log("[PURCHASE-POINTS] Exchange rate:", exchangeRate, "Price per point cents:", pricePerPointCents);

    // Get or create Celebration Points product
    const productIdField = environment === "live" ? "stripe_celebration_product_id_live" : "stripe_celebration_product_id_test";
    let productId = environment === "live"
      ? platformSettings?.stripe_celebration_product_id_live
      : platformSettings?.stripe_celebration_product_id_test;

    if (!productId) {
      console.log("[PURCHASE-POINTS] Creating Celebration Points product in Stripe");
      const product = await stripe.products.create({
        name: "Celebration Points",
        description: "Points for employee birthday and anniversary rewards",
        metadata: { type: "celebration_points", environment },
      });
      productId = product.id;

      // Store product ID back to platform_settings
      await supabaseAdmin
        .from("platform_settings")
        .update({ [productIdField]: productId })
        .eq("key", "platform_settings");

      console.log("[PURCHASE-POINTS] Created product:", productId);
    }

    // Create a price for this exact unit amount
    const price = await stripe.prices.create({
      product: productId,
      unit_amount: pricePerPointCents,
      currency: "usd",
    });

    console.log("[PURCHASE-POINTS] Created price:", price.id, "for", pricePerPointCents, "cents/point");

    // Create Checkout session
    const baseUrl = origin || "https://gratia-team-boost.lovable.app";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "payment",
      line_items: [
        {
          price: price.id,
          quantity: pointsQuantity,
        },
      ],
      metadata: {
        company_id: companyId,
        points_quantity: String(pointsQuantity),
        purchase_type: "celebration_points",
      },
      success_url: `${baseUrl}/dashboard/settings?points_purchase=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/dashboard/settings?points_purchase=cancelled`,
    });

    console.log("[PURCHASE-POINTS] Checkout session created:", session.id);

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[PURCHASE-POINTS] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
