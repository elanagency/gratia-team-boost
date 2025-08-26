
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Will be fetched from platform settings

// Helper logging function
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");
    
    const { companyId, employeeCount = 1 } = await req.json();
    
    if (!companyId || employeeCount <= 0) {
      throw new Error("Company ID and valid employee count required");
    }

    logStep("Request validated", { companyId, employeeCount });

    // Initialize Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }
    
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    logStep("Stripe initialized");

    // Use service role to access company data
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get company details
    const { data: company, error: companyError } = await supabaseService
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      logStep("Company not found", { companyError });
      throw new Error("Company not found");
    }

    logStep("Company found", { companyName: company.name });

    // Check if subscription already exists
    if (company.stripe_subscription_id) {
      logStep("Subscription already exists", { subscriptionId: company.stripe_subscription_id });
      return new Response(
        JSON.stringify({ error: "Subscription already exists" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Get company admin email for customer creation
    const { data: adminMember, error: adminError } = await supabaseService
      .from('company_members')
      .select('user_id')
      .eq('company_id', companyId)
      .eq('is_admin', true)
      .single();

    if (adminError || !adminMember) {
      logStep("Admin not found", { adminError });
      throw new Error("Company admin not found");
    }

    logStep("Admin found", { adminUserId: adminMember.user_id });

    // Get admin email using get-user-emails function
    const { data: emailsResponse, error: emailsError } = await supabaseService.functions.invoke("get-user-emails", {
      body: { userIds: [adminMember.user_id] },
    });

    if (emailsError || !emailsResponse?.emails?.[adminMember.user_id]) {
      logStep("Admin email not found", { emailsError });
      throw new Error("Admin email not found");
    }

    const adminEmail = emailsResponse.emails[adminMember.user_id];
    logStep("Admin email retrieved", { adminEmail });

    // Get pricing from platform settings
    const { data: pricingSetting } = await supabaseService
      .from('platform_settings')
      .select('value')
      .eq('key', 'member_monthly_price_cents')
      .single();
    
    const MONTHLY_PRICE_PER_EMPLOYEE = pricingSetting?.value ? parseInt(JSON.parse(pricingSetting.value)) : 299;
    logStep("Pricing retrieved", { MONTHLY_PRICE_PER_EMPLOYEE });

    // Create or get Stripe customer
    let customerId = company.stripe_customer_id;
    if (!customerId) {
      logStep("Creating new Stripe customer");
      const customer = await stripe.customers.create({
        email: adminEmail,
        name: company.name,
        metadata: {
          company_id: companyId,
        },
      });
      customerId = customer.id;
      logStep("Customer created", { customerId });

      // Update company with customer ID
      await supabaseService
        .from('companies')
        .update({ stripe_customer_id: customerId })
        .eq('id', companyId);
        
      logStep("Company updated with customer ID");
    } else {
      logStep("Using existing customer", { customerId });
    }

    // Calculate prorated amount for first billing
    const now = new Date();
    const nextBillingDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysRemaining = Math.ceil((nextBillingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    const proratedAmount = Math.round(
      (MONTHLY_PRICE_PER_EMPLOYEE * employeeCount * daysRemaining) / daysInMonth
    );

    logStep("Prorated billing calculated", { 
      daysRemaining, 
      daysInMonth, 
      proratedAmount,
      nextBillingDate: nextBillingDate.toISOString()
    });

    // First create a product and price
    logStep("Creating Stripe product");
    const product = await stripe.products.create({
      name: "Team Member Subscription",
      description: "Monthly subscription per team member",
    });

    logStep("Creating Stripe price");
    const price = await stripe.prices.create({
      currency: "usd",
      unit_amount: MONTHLY_PRICE_PER_EMPLOYEE,
      recurring: {
        interval: "month",
      },
      product: product.id,
    });

    logStep("Product and price created", { productId: product.id, priceId: price.id });

    // Create subscription with the created price
    logStep("Creating subscription");
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [
        {
          price: price.id,
          quantity: employeeCount,
        },
      ],
      billing_cycle_anchor: Math.floor(nextBillingDate.getTime() / 1000),
      proration_behavior: "create_prorations",
      metadata: {
        company_id: companyId,
        initial_employee_count: employeeCount.toString(),
      },
    });

    logStep("Subscription created successfully", { 
      subscriptionId: subscription.id,
      status: subscription.status
    });

    // Update company with subscription details
    await supabaseService
      .from('companies')
      .update({
        stripe_subscription_id: subscription.id,
        subscription_status: subscription.status,
        billing_cycle_anchor: 1, // Always bill on the 1st
      })
      .eq('id', companyId);

    logStep("Company updated with subscription details");

    // Create subscription event record
    await supabaseService
      .from('subscription_events')
      .insert({
        company_id: companyId,
        event_type: 'created',
        previous_quantity: 0,
        new_quantity: employeeCount,
        amount_charged: proratedAmount,
        metadata: {
          subscription_id: subscription.id,
          product_id: product.id,
          price_id: price.id,
          prorated_days: daysRemaining,
          total_days: daysInMonth,
        },
      });

    logStep("Subscription event recorded");

    return new Response(
      JSON.stringify({
        message: "Subscription created successfully",
        subscription_id: subscription.id,
        status: subscription.status,
        prorated_amount: proratedAmount,
        next_billing_date: nextBillingDate.toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-subscription", { error: errorMessage });
    console.error("Subscription creation error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
