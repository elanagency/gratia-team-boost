import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to get the correct Stripe key based on company environment
async function getStripeKey(supabaseClient: any, companyId: string): Promise<string> {
  console.log('[GET-PAYMENT-METHOD] Getting company environment mode');
  
  // Get environment setting from platform_settings
  const { data: envData } = await supabaseClient
    .from('platform_settings')
    .select('value')
    .eq('key', 'stripe_environment')
    .maybeSingle();
  
  const environment = envData?.value || 'test';
  console.log(`[GET-PAYMENT-METHOD] Using Stripe environment: ${environment}`);
  
  // Get the appropriate Stripe key
  const keyName = environment === 'live' ? 'STRIPE_SECRET_KEY_LIVE' : 'STRIPE_SECRET_KEY_TEST';
  const stripeKey = Deno.env.get(keyName);
  
  if (!stripeKey) {
    throw new Error(`Missing Stripe key for environment: ${environment}`);
  }
  
  return stripeKey;
}

function logStep(step: string, details?: any) {
  console.log(`[GET-PAYMENT-METHOD] ${step}`, details ? JSON.stringify(details, null, 2) : '');
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Starting payment method details fetch');

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      logStep('Authentication failed', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    logStep('User authenticated', { userId: user.id });

    // Get user's company
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.company_id) {
      logStep('Failed to get user profile or company', profileError);
      return new Response(
        JSON.stringify({ error: 'Company not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const companyId = profile.company_id;
    logStep('Found company', { companyId });

    // Get company details including Stripe customer ID
    const { data: company, error: companyError } = await supabaseClient
      .from('companies')
      .select('stripe_customer_id_test, stripe_customer_id_live, environment')
      .eq('id', companyId)
      .single()

    if (companyError || !company) {
      logStep('Failed to get company details', companyError);
      return new Response(
        JSON.stringify({ error: 'Company details not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const environment = company.environment || 'test';
    const stripeCustomerId = environment === 'live' 
      ? company.stripe_customer_id_live 
      : company.stripe_customer_id_test;

    if (!stripeCustomerId) {
      logStep('No Stripe customer ID found for environment', { environment });
      return new Response(
        JSON.stringify({ error: 'No payment method found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    logStep('Found Stripe customer', { customerId: stripeCustomerId, environment });

    // Initialize Stripe with correct key
    const stripeKey = await getStripeKey(supabaseClient, companyId);
    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

    // Get customer's default payment method
    const customer = await stripe.customers.retrieve(stripeCustomerId, {
      expand: ['invoice_settings.default_payment_method']
    });

    if (!customer || customer.deleted) {
      logStep('Customer not found or deleted');
      return new Response(
        JSON.stringify({ error: 'Customer not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const defaultPaymentMethod = customer.invoice_settings?.default_payment_method;
    
    if (!defaultPaymentMethod || typeof defaultPaymentMethod === 'string') {
      logStep('No default payment method found');
      return new Response(
        JSON.stringify({ error: 'No payment method found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Extract payment method details
    const paymentMethodDetails = {
      last4: defaultPaymentMethod.card?.last4 || 'N/A',
      brand: defaultPaymentMethod.card?.brand || 'Unknown',
      exp_month: defaultPaymentMethod.card?.exp_month,
      exp_year: defaultPaymentMethod.card?.exp_year,
      type: defaultPaymentMethod.type
    };

    logStep('Payment method details retrieved', paymentMethodDetails);

    return new Response(
      JSON.stringify({
        success: true,
        paymentMethod: paymentMethodDetails
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    logStep('Error occurred', { error: error.message });
    console.error('Error in get-payment-method-details:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch payment method details',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})