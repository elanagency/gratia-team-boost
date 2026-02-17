import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyId } = await req.json();
    console.log('Updating subscription seats for company:', companyId);

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

    // If no subscription exists, billing hasn't been set up yet
    if (!company.stripe_subscription_id) {
      console.log('No subscription found - billing not set up yet');
      return Response.json({
        error: 'No active subscription. Admin must set up billing first.'
      }, { status: 400, headers: corsHeaders });
    }

    // Count active non-admin members
    const { data: activeSeats, error: seatsError } = await supabase
      .rpc('get_stripe_active_member_count', { company_id: companyId });

    if (seatsError) {
      console.error('Error counting active seats:', seatsError);
      return Response.json({ error: 'Failed to count active seats' }, { status: 500, headers: corsHeaders });
    }

    // Total = active non-admin members + 1 (admin)
    const totalBillableSeats = activeSeats || 0;
    console.log('Active non-admin seats:', activeSeats, 'Total billable (incl. admin):', totalBillableSeats);

    // Get appropriate Stripe key based on company environment
    const environment = company.environment || 'live';
    const stripeKey = environment === 'live' 
      ? Deno.env.get('STRIPE_SECRET_KEY_LIVE')! 
      : Deno.env.get('STRIPE_SECRET_KEY_TEST')!;

    const { default: Stripe } = await import('https://esm.sh/stripe@14.14.0');
    const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' });

    // Retrieve current subscription
    const subscription = await stripe.subscriptions.retrieve(company.stripe_subscription_id);
    const currentQuantity = subscription.items.data[0]?.quantity || 1;
    const subscriptionItemId = subscription.items.data[0]?.id;

    if (currentQuantity === totalBillableSeats) {
      console.log('Subscription quantity already correct:', totalBillableSeats);
      return Response.json({
        success: true,
        subscriptionId: company.stripe_subscription_id,
        activeSeats: totalBillableSeats,
        message: 'Subscription quantity already up to date'
      }, { headers: corsHeaders });
    }

    // Update subscription quantity with proration
    const updatedSubscription = await stripe.subscriptions.update(
      company.stripe_subscription_id,
      {
        items: [{
          id: subscriptionItemId,
          quantity: totalBillableSeats
        }],
        proration_behavior: 'always_invoice',
      }
    );

    console.log('Subscription updated from', currentQuantity, 'to', totalBillableSeats, 'seats');

    // Update company record
    await supabase
      .from('companies')
      .update({
        stripe_subscription_item_id: subscriptionItemId,
        subscription_status: 'active',
        ...(company.first_active_member_at ? {} : { first_active_member_at: new Date().toISOString() })
      })
      .eq('id', companyId);

    // Log subscription event
    await supabase
      .from('subscription_events')
      .insert({
        company_id: companyId,
        event_type: 'quantity_updated',
        previous_quantity: currentQuantity,
        new_quantity: totalBillableSeats,
        metadata: {
          subscription_id: company.stripe_subscription_id,
          trigger: 'member_login',
          environment
        }
      });

    return Response.json({
      success: true,
      subscriptionId: company.stripe_subscription_id,
      previousSeats: currentQuantity,
      activeSeats: totalBillableSeats,
      message: 'Subscription quantity updated'
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Error in billing-activate-on-first-login:', error);
    return Response.json({
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500, headers: corsHeaders });
  }
});
