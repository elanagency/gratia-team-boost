import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper function to get the appropriate Stripe key
const getStripeKey = async (supabaseAdmin: any): Promise<string> => {
  try {
    const { data: envSetting } = await supabaseAdmin
      .from('platform_settings')
      .select('value')
      .eq('key', 'environment_mode')
      .single();
    
    const environment = envSetting?.value || 'test';
    
    if (environment === 'live') {
      return Deno.env.get("STRIPE_SECRET_KEY_LIVE") || "";
    } else {
      return Deno.env.get("STRIPE_SECRET_KEY_TEST") || "";
    }
  } catch (error) {
    console.error("Error getting Stripe key:", error);
    return Deno.env.get("STRIPE_SECRET_KEY_TEST") || "";
  }
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyId, activatedUserId } = await req.json();

    if (!companyId) {
      return new Response(
        JSON.stringify({ error: "Company ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[CONVERT-TRIAL] Converting trial to paid for company:", companyId, "User:", activatedUserId);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Get company information
    const { data: company, error: companyError } = await supabaseAdmin
      .from("companies")
      .select("*")
      .eq("id", companyId)
      .single();

    if (companyError || !company) {
      console.error("[CONVERT-TRIAL] Company not found:", companyError);
      return new Response(
        JSON.stringify({ error: "Company not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if company is in trial mode and needs conversion
    if (!company.trial_mode || company.first_active_member_at) {
      console.log("[CONVERT-TRIAL] Company not in trial or already converted");
      return new Response(
        JSON.stringify({ message: "Company already converted or not in trial" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get pricing from platform settings
    const { data: pricingSetting } = await supabaseAdmin
      .from('platform_settings')
      .select('value')
      .eq('key', 'member_monthly_price_cents')
      .single();
    
    const unitPrice = pricingSetting?.value ? parseInt(JSON.parse(pricingSetting.value)) : 1000;

    // Get active team members count
    const { count: activeMembers } = await supabaseAdmin
      .from("company_members")
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("invitation_status", "active");

    const teamSlots = Math.max(activeMembers || 1, 1); // At least 1 slot

    console.log("[CONVERT-TRIAL] Converting with:", { activeMembers, teamSlots, unitPrice });

    // Initialize Stripe
    const stripeKey = await getStripeKey(supabaseAdmin);
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Update existing subscription from $0 trial to paid
    if (company.stripe_subscription_id) {
      try {
        const subscription = await stripe.subscriptions.retrieve(company.stripe_subscription_id);
        
        // Update subscription to remove trial and set proper pricing
        await stripe.subscriptions.update(company.stripe_subscription_id, {
          items: [{
            id: subscription.items.data[0].id,
            price_data: {
              currency: "usd",
              unit_amount: unitPrice,
              recurring: { interval: "month" },
              product_data: {
                name: "Team Slots",
                description: `Active team slots for your organization`,
              },
            },
            quantity: teamSlots,
          }],
          trial_end: "now", // End trial immediately
          proration_behavior: 'create_prorations',
        });

        console.log("[CONVERT-TRIAL] Updated existing subscription:", company.stripe_subscription_id);
      } catch (error) {
        console.error("[CONVERT-TRIAL] Error updating subscription:", error);
        // If subscription doesn't exist, we'll create a new one below
      }
    } else {
      // Create new subscription for companies without Stripe subscription
      if (company.stripe_customer_id) {
        const subscription = await stripe.subscriptions.create({
          customer: company.stripe_customer_id,
          items: [{
            price_data: {
              currency: "usd",
              unit_amount: unitPrice,
              recurring: { interval: "month" },
              product_data: {
                name: "Team Slots",
                description: `Active team slots for your organization`,
              },
            },
            quantity: teamSlots,
          }],
          metadata: {
            company_id: companyId,
            converted_from_trial: "true",
          },
        });

        // Update company with new subscription ID
        await supabaseAdmin
          .from("companies")
          .update({ stripe_subscription_id: subscription.id })
          .eq("id", companyId);

        console.log("[CONVERT-TRIAL] Created new subscription:", subscription.id);
      }
    }

    // Update company: end trial mode, set first active member timestamp, update team slots
    const now = new Date().toISOString();
    await supabaseAdmin
      .from("companies")
      .update({
        trial_mode: false,
        first_active_member_at: now,
        subscription_status: "active",
        team_slots: teamSlots,
      })
      .eq("id", companyId);

    // Update all trial users to be non-trial
    await supabaseAdmin
      .from("company_members")
      .update({ is_trial_user: false })
      .eq("company_id", companyId)
      .eq("is_trial_user", true);

    // Log the conversion event
    await supabaseAdmin
      .from("subscription_events")
      .insert({
        company_id: companyId,
        event_type: "trial_converted",
        new_slots: teamSlots,
        metadata: {
          activated_by_user: activatedUserId,
          converted_at: now,
          active_members_count: activeMembers,
        }
      });

    console.log("[CONVERT-TRIAL] Trial conversion completed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Trial converted to paid subscription",
        team_slots: teamSlots,
        subscription_status: "active",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[CONVERT-TRIAL] Error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});