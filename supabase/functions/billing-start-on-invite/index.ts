import { corsHeaders } from '../_shared/cors.ts';

// Helper function to get Stripe key based on company environment
async function getStripeKey(supabase: any, companyId: string): Promise<string> {
  // First check company environment
  const { data: company } = await supabase
    .from('companies')
    .select('environment')
    .eq('id', companyId)
    .single();

  const environment = company?.environment || 'live';
  
  // Get the appropriate Stripe key based on environment
  const { data: settings } = await supabase
    .from('platform_settings')
    .select('value')
    .eq('key', 'environment_mode')
    .maybeSingle();
  
  const platformMode = settings?.value ? JSON.parse(settings.value) : 'live';
  
  // Use company environment if set, otherwise platform environment
  const useTestMode = environment === 'test' || (environment === 'live' && platformMode === 'test');
  
  return useTestMode ? 
    Deno.env.get('STRIPE_SECRET_KEY_TEST')! : 
    Deno.env.get('STRIPE_SECRET_KEY_LIVE')!;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyId, adminEmail, successUrl, cancelUrl } = await req.json();
    
    console.log('Starting billing setup for company:', companyId);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.49.4');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if company already has an active subscription
    const { data: company } = await supabase
      .from('companies')
      .select('stripe_subscription_id, stripe_customer_id_live, stripe_customer_id_test, billing_ready, environment')
      .eq('id', companyId)
      .single();

    if (!company) {
      throw new Error('Company not found');
    }

    // If already has subscription, no need for setup
    if (company.stripe_subscription_id) {
      return Response.json({
        checkoutUrl: null,
        message: 'Company already has active subscription'
      }, { headers: corsHeaders });
    }

    // If billing is already ready, no need for setup
    if (company.billing_ready) {
      return Response.json({
        checkoutUrl: null,
        message: 'Billing already set up'
      }, { headers: corsHeaders });
    }

    // Get appropriate Stripe key
    const stripeKey = await getStripeKey(supabase, companyId);
    const { default: Stripe } = await import('https://esm.sh/stripe@14.14.0');
    const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' });

    // Determine which customer ID to use based on environment
    const environment = company.environment || 'live';
    const isTestMode = environment === 'test' || stripeKey.includes('sk_test_');
    const existingCustomerId = isTestMode ? 
      company.stripe_customer_id_test : 
      company.stripe_customer_id_live;

    let customerId = existingCustomerId;

    // Create or retrieve Stripe customer
    if (!customerId) {
      console.log('Creating new Stripe customer for environment:', environment);
      const customer = await stripe.customers.create({
        email: adminEmail,
        metadata: { 
          companyId,
          environment 
        }
      });
      customerId = customer.id;

      // Update company with customer ID
      const updateData = isTestMode ? 
        { stripe_customer_id_test: customerId } :
        { stripe_customer_id_live: customerId };

      await supabase
        .from('companies')
        .update(updateData)
        .eq('id', companyId);

      console.log('Created customer:', customerId);
    }

    // Create Checkout Session in setup mode
    const session = await stripe.checkout.sessions.create({
      mode: 'setup',
      customer: customerId,
      payment_method_types: ['card'],
      setup_intent_data: { 
        usage: 'off_session',
        metadata: {
          companyId,
          environment
        }
      },
      success_url: successUrl || `${req.headers.get('origin')}/dashboard/team?setup=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${req.headers.get('origin')}/dashboard/team?setup=cancel`,
      metadata: { 
        companyId,
        trigger: 'invite_click',
        environment
      },
    });

    console.log('Created checkout session:', session.id);

    return Response.json({
      checkoutUrl: session.url,
      sessionId: session.id
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Error in billing-start-on-invite:', error);
    return Response.json({
      error: error.message
    }, {
      status: 500,
      headers: corsHeaders
    });
  }
});