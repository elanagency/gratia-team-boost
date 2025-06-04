
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
    // Get authenticated user
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Authentication required");
    }

    // Use service role for database operations
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get user's company
    const { data: memberData, error: memberError } = await supabaseService
      .from('company_members')
      .select('company_id, is_admin')
      .eq('user_id', user.id)
      .single();

    if (memberError || !memberData) {
      throw new Error("User is not a member of any company");
    }

    // Get company subscription details
    const { data: company, error: companyError } = await supabaseService
      .from('companies')
      .select('*')
      .eq('id', memberData.company_id)
      .single();

    if (companyError || !company) {
      throw new Error("Company not found");
    }

    // Get current team member count
    const { data: memberCount, error: countError } = await supabaseService
      .rpc('get_company_member_count', { company_id: memberData.company_id });

    if (countError) {
      console.error("Error getting member count:", countError);
    }

    let subscriptionStatus = {
      has_subscription: false,
      status: company.subscription_status || 'inactive',
      current_quantity: 0,
      member_count: memberCount || 0,
      next_billing_date: null,
      amount_per_member: 299, // $2.99 in cents
    };

    // If there's a Stripe subscription, get updated info
    if (company.stripe_subscription_id) {
      const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
        apiVersion: "2023-10-16",
      });

      try {
        const subscription = await stripe.subscriptions.retrieve(company.stripe_subscription_id);
        
        subscriptionStatus = {
          has_subscription: true,
          status: subscription.status,
          current_quantity: subscription.items.data[0]?.quantity || 0,
          member_count: memberCount || 0,
          next_billing_date: new Date(subscription.current_period_end * 1000).toISOString(),
          amount_per_member: 299,
        };

        // Update company status if it's different
        if (company.subscription_status !== subscription.status) {
          await supabaseService
            .from('companies')
            .update({ subscription_status: subscription.status })
            .eq('id', memberData.company_id);
        }
      } catch (stripeError) {
        console.error("Error fetching Stripe subscription:", stripeError);
      }
    }

    return new Response(
      JSON.stringify(subscriptionStatus),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Subscription status check error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
