
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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_ANON_KEY") || "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "User not authenticated" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's company membership
    const { data: membership, error: membershipError } = await supabaseClient
      .from("company_members")
      .select("company_id, is_admin")
      .eq("user_id", user.id)
      .eq("is_admin", true)
      .single();

    if (membershipError || !membership) {
      return new Response(
        JSON.stringify({ error: "Company membership not found or not admin" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const companyId = membership.company_id;

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

    // Get company info with subscription status
    const { data: company, error: companyError } = await supabaseAdmin
      .from("companies")
      .select("team_slots, subscription_status, stripe_subscription_id")
      .eq("id", companyId)
      .single();

    if (companyError) {
      console.error("Error fetching company:", companyError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch company information" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get current used slots
    const { data: usedSlots, error: slotsError } = await supabaseAdmin
      .rpc('get_used_team_slots', { company_id: companyId });

    if (slotsError) {
      console.error("Error getting used slots:", slotsError);
    }

    const currentUsedSlots = usedSlots || 0;
    const availableSlots = company.team_slots || 0;

    let subscriptionDetails = null;
    if (company.stripe_subscription_id) {
      try {
        const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
          apiVersion: "2023-10-16",
        });

        const subscription = await stripe.subscriptions.retrieve(company.stripe_subscription_id);
        
        subscriptionDetails = {
          current_period_end: subscription.current_period_end,
          status: subscription.status,
          quantity: subscription.items.data[0]?.quantity || 0,
        };
      } catch (stripeError) {
        console.error("Error fetching Stripe subscription:", stripeError);
      }
    }

    const response = {
      has_subscription: !!company.stripe_subscription_id,
      status: company.subscription_status || 'inactive',
      team_slots: availableSlots,
      used_slots: currentUsedSlots,
      available_slots: Math.max(0, availableSlots - currentUsedSlots),
      next_billing_date: subscriptionDetails?.current_period_end 
        ? new Date(subscriptionDetails.current_period_end * 1000).toISOString()
        : null,
      amount_per_slot: 299, // $2.99 in cents
      slot_utilization: availableSlots > 0 ? Math.round((currentUsedSlots / availableSlots) * 100) : 0,
    };

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in check-subscription-status:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
