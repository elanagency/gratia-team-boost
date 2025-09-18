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
    const { companyId } = await req.json();
    
    console.log('Activating billing for company on first login:', companyId);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.49.4');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get company details
    const { data: company } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (!company) {
      throw new Error('Company not found');
    }

    // Check if billing is ready
    if (!company.billing_ready) {
      return Response.json({
        error: 'Billing not set up yet'
      }, {
        status: 400,
        headers: corsHeaders
      });
    }

    // Check if subscription already exists (idempotent)
    if (company.stripe_subscription_id) {
      console.log('Subscription already exists:', company.stripe_subscription_id);
      return Response.json({
        success: true,
        subscriptionId: company.stripe_subscription_id,
        message: 'Subscription already active'
      }, { headers: corsHeaders });
    }

    // Count active non-admin members
    const { count: activeSeats } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('status', 'active')
      .eq('is_admin', false);

    if (!activeSeats || activeSeats < 1) {
      return Response.json({
        error: 'No active non-admin members found'
      }, {
        status: 400,
        headers: corsHeaders
      });
    }

    console.log('Active seats to bill:', activeSeats);

    // Get pricing from platform settings
    const { data: pricingData } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'member_monthly_price_cents')
      .single();

    const pricePerMemberCents = pricingData?.value ? 
      parseInt(JSON.parse(pricingData.value)) : 1000; // Default $10.00

    // Get appropriate Stripe key and customer ID
    const stripeKey = await getStripeKey(supabase, companyId);
    const { default: Stripe } = await import('https://esm.sh/stripe@14.14.0');
    const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' });

    const environment = company.environment || 'live';
    const isTestMode = environment === 'test' || stripeKey.includes('sk_test_');
    const customerId = isTestMode ? 
      company.stripe_customer_id_test : 
      company.stripe_customer_id_live;

    if (!customerId) {
      throw new Error('No Stripe customer ID found');
    }

    // Create price if it doesn't exist
    let priceId: string;
    try {
      // Try to find existing price
      const prices = await stripe.prices.list({
        product: 'team_member_subscription',
        unit_amount: pricePerMemberCents,
        currency: 'usd',
        recurring: { interval: 'month' },
        active: true,
        limit: 1
      });

      if (prices.data.length > 0) {
        priceId = prices.data[0].id;
      } else {
        // Create new price
        const price = await stripe.prices.create({
          product_data: {
            name: 'Team Member Subscription',
            id: 'team_member_subscription'
          },
          unit_amount: pricePerMemberCents,
          currency: 'usd',
          recurring: { interval: 'month' },
          metadata: {
            environment,
            companyId
          }
        });
        priceId = price.id;
      }
    } catch (error) {
      // If product doesn't exist, create it with the price
      const price = await stripe.prices.create({
        product_data: {
          name: 'Team Member Subscription'
        },
        unit_amount: pricePerMemberCents,
        currency: 'usd',
        recurring: { interval: 'month' },
        metadata: {
          environment,
          companyId
        }
      });
      priceId = price.id;
    }

    // Calculate billing cycle anchor for the 1st of next month
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const billingCycleAnchor = Math.floor(nextMonth.getTime() / 1000);

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{
        price: priceId,
        quantity: activeSeats
      }],
      collection_method: 'charge_automatically',
      billing_cycle_anchor: billingCycleAnchor,
      proration_behavior: 'none',
      expand: ['items.data'],
      metadata: {
        companyId,
        environment,
        trigger: 'first_member_login'
      }
    });

    console.log('Created subscription:', subscription.id);

    // Update company with subscription details
    await supabase
      .from('companies')
      .update({
        stripe_subscription_id: subscription.id,
        stripe_subscription_item_id: subscription.items.data[0].id,
        subscription_status: 'active',
        first_charge_at: new Date().toISOString()
      })
      .eq('id', companyId);

    // Log subscription event
    await supabase
      .from('subscription_events')
      .insert({
        company_id: companyId,
        event_type: 'subscription_created',
        new_quantity: activeSeats,
        metadata: {
          subscription_id: subscription.id,
          trigger: 'first_member_login',
          environment
        }
      });

    console.log('Billing activation completed successfully');

    return Response.json({
      success: true,
      subscriptionId: subscription.id,
      activeSeats,
      message: 'Subscription created successfully'
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Error in billing-activate-on-first-login:', error);
    return Response.json({
      error: error.message
    }, {
      status: 500,
      headers: corsHeaders
    });
  }
});