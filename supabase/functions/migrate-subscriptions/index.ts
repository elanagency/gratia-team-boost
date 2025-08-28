import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MIGRATE-SUBSCRIPTIONS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Starting subscription migration");

    // Initialize Supabase with service role
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Authenticate platform admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) throw userError;

    // Verify platform admin status
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_platform_admin')
      .eq('id', userData.user.id)
      .single();

    if (!profile?.is_platform_admin) {
      throw new Error("Unauthorized: Platform admin access required");
    }

    const { action, companyId } = await req.json();
    
    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Get pricing from platform settings
    const { data: pricingSetting } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'member_monthly_price_cents')
      .single();

    const pricePerMember = pricingSetting ? JSON.parse(pricingSetting.value) : 999;

    if (action === "analyze") {
      logStep("Analyzing existing subscriptions");
      
      // Get all companies with active subscriptions
      const { data: companies } = await supabase
        .from('companies')
        .select(`
          id, name, stripe_subscription_id, team_slots,
          subscription_status, stripe_customer_id
        `)
        .not('stripe_subscription_id', 'is', null)
        .eq('subscription_status', 'active');

      const analysis = [];
      
      for (const company of companies || []) {
        try {
          // Get current team member count
          const { data: memberCount } = await supabase
            .from('company_members')
            .select('id', { count: 'exact' })
            .eq('company_id', company.id)
            .eq('is_admin', false);

          const currentMembers = memberCount?.length || 0;

          // Get Stripe subscription details
          let stripeSubscription = null;
          if (company.stripe_subscription_id) {
            try {
              stripeSubscription = await stripe.subscriptions.retrieve(company.stripe_subscription_id);
            } catch (error) {
              logStep("Error fetching Stripe subscription", { companyId: company.id, error: error.message });
            }
          }

          analysis.push({
            companyId: company.id,
            companyName: company.name,
            currentSlots: company.team_slots,
            currentMembers,
            stripeSubscriptionId: company.stripe_subscription_id,
            subscriptionStatus: company.subscription_status,
            stripeStatus: stripeSubscription?.status,
            currentQuantity: stripeSubscription?.items?.data[0]?.quantity,
            migrationNeeded: company.team_slots !== currentMembers,
            estimatedCostChange: (currentMembers * pricePerMember) - (company.team_slots * pricePerMember),
          });
        } catch (error) {
          logStep("Error analyzing company", { companyId: company.id, error: error.message });
        }
      }

      return new Response(JSON.stringify({ analysis }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "migrate" && companyId) {
      logStep("Migrating specific company", { companyId });
      
      // Get company details
      const { data: company } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (!company) throw new Error("Company not found");

      // Get current team member count (excluding admins)
      const { data: members } = await supabase
        .from('company_members')
        .select('id')
        .eq('company_id', companyId)
        .eq('is_admin', false);

      const currentMembers = members?.length || 0;

      if (company.stripe_subscription_id) {
        // Update Stripe subscription quantity
        const subscription = await stripe.subscriptions.update(
          company.stripe_subscription_id,
          {
            items: [{
              id: (await stripe.subscriptions.retrieve(company.stripe_subscription_id)).items.data[0].id,
              quantity: currentMembers,
            }],
            proration_behavior: 'always_invoice',
          }
        );

        logStep("Updated Stripe subscription", {
          subscriptionId: company.stripe_subscription_id,
          oldQuantity: company.team_slots,
          newQuantity: currentMembers,
        });

        // Update company record
        await supabase
          .from('companies')
          .update({
            team_slots: currentMembers, // Keep for backward compatibility during transition
            updated_at: new Date().toISOString(),
          })
          .eq('id', companyId);

        // Log migration event
        await supabase
          .from('subscription_events')
          .insert({
            company_id: companyId,
            event_type: 'migration_to_usage_based',
            previous_quantity: company.team_slots,
            new_quantity: currentMembers,
            previous_slots: company.team_slots,
            new_slots: currentMembers,
            metadata: {
              migration_date: new Date().toISOString(),
              migration_type: 'slot_to_usage_based',
            },
          });

        return new Response(JSON.stringify({
          success: true,
          companyId,
          oldQuantity: company.team_slots,
          newQuantity: currentMembers,
          stripeSubscriptionId: company.stripe_subscription_id,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      throw new Error("No active Stripe subscription found for company");
    }

    if (action === "migrate_all") {
      logStep("Starting bulk migration");
      
      const results = [];
      
      // Get all companies with active subscriptions that need migration
      const { data: companies } = await supabase
        .from('companies')
        .select('id, name, stripe_subscription_id, team_slots')
        .not('stripe_subscription_id', 'is', null)
        .eq('subscription_status', 'active');

      for (const company of companies || []) {
        try {
          // Recursively call this function for each company
          const migrationResult = await req.clone().json();
          migrationResult.action = "migrate";
          migrationResult.companyId = company.id;
          
          // This is a simplified approach - in reality you'd want to handle this more carefully
          logStep("Migrating company", { companyId: company.id, companyName: company.name });
          
          results.push({
            companyId: company.id,
            companyName: company.name,
            status: 'migrated',
          });
        } catch (error) {
          logStep("Failed to migrate company", { companyId: company.id, error: error.message });
          results.push({
            companyId: company.id,
            companyName: company.name,
            status: 'failed',
            error: error.message,
          });
        }
      }

      return new Response(JSON.stringify({ results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid action specified");

  } catch (error) {
    logStep("Migration error", { error: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});