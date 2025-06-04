
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MONTHLY_PRICE_PER_EMPLOYEE = 299; // $2.99 in cents

// Helper logging function
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-SUBSCRIPTION-CHECKOUT] ${step}${detailsStr}`);
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

    logStep("User authenticated", { userId: user.id });

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
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

    // Check if customer already exists
    const customers = await stripe.customers.list({ email: adminEmail, limit: 1 });
    let customerId;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Using existing customer", { customerId });
    } else {
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
    }

    // Calculate monthly cost
    const monthlyAmount = MONTHLY_PRICE_PER_EMPLOYEE * employeeCount;

    logStep("Creating Stripe checkout session", { monthlyAmount, employeeCount });

    // Create Stripe checkout session for subscription
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Team Member Subscription (${employeeCount} member${employeeCount > 1 ? 's' : ''})`,
              description: `Monthly subscription for ${employeeCount} team member${employeeCount > 1 ? 's' : ''} at $2.99 each`,
            },
            unit_amount: MONTHLY_PRICE_PER_EMPLOYEE,
            recurring: {
              interval: "month",
            },
          },
          quantity: employeeCount,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/dashboard/team?setup=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/dashboard/team?setup=cancelled`,
      metadata: {
        company_id: companyId,
        employee_count: employeeCount.toString(),
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(
      JSON.stringify({ 
        url: session.url,
        session_id: session.id
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-subscription-checkout", { error: errorMessage });
    console.error("Subscription checkout creation error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
