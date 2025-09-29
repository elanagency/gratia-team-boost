import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import Stripe from 'https://esm.sh/stripe@14.21.0'
import { getErrorMessage, createErrorResponse } from "../_shared/error-utils.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const getStripeKey = async (supabase: any): Promise<string> => {
  const { data: settings, error } = await supabase
    .from('platform_settings')
    .select('*')
    .eq('key', 'platform_settings')
    .single();

  if (error || !settings) {
    console.error('Error fetching platform settings:', error);
    throw new Error('Failed to fetch platform settings');
  }

  // Check environment mode to determine which Stripe key to use
  const environmentMode = Deno.env.get('ENVIRONMENT_MODE') || 'test';
  
  if (environmentMode === 'live') {
    return Deno.env.get('STRIPE_SECRET_KEY_LIVE') || Deno.env.get('STRIPE_SECRET_KEY') || '';
  } else {
    return Deno.env.get('STRIPE_SECRET_KEY_TEST') || Deno.env.get('STRIPE_SECRET_KEY') || '';
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current platform settings
    const { data: settings, error: settingsError } = await supabase
      .from('platform_settings')
      .select('*')
      .eq('key', 'platform_settings')
      .single();

    if (settingsError || !settings) {
      console.error('Error fetching platform settings:', settingsError);
      throw new Error('Failed to fetch platform settings');
    }

    const priceInCents = settings.monthly_price_per_team_member_in_cents;
    
    if (!priceInCents) {
      throw new Error('No price configured in platform settings');
    }

    // Initialize Stripe
    const stripeKeyLive = Deno.env.get('STRIPE_SECRET_KEY_LIVE') || '';
    const stripeKeyTest = Deno.env.get('STRIPE_SECRET_KEY_TEST') || '';
    
    const results = {
      live: null as any,
      test: null as any,
      errors: [] as string[]
    };

    // Process both live and test environments
    for (const environment of ['live', 'test']) {
      try {
        const stripeKey = environment === 'live' ? stripeKeyLive : stripeKeyTest;
        
        if (!stripeKey) {
          results.errors.push(`No Stripe key configured for ${environment} environment`);
          continue;
        }

        const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

        // Create or get product
        let product;
        const existingProductId = environment === 'live' 
          ? settings.stripe_product_id_live 
          : settings.stripe_product_id_test;

        if (existingProductId) {
          try {
            product = await stripe.products.retrieve(existingProductId);
          } catch (error) {
            console.log(`Product ${existingProductId} not found, creating new one`);
            product = null;
          }
        }

        if (!product) {
          product = await stripe.products.create({
            name: 'Team Member Subscription',
            description: 'Monthly subscription per team member',
            type: 'service',
          });
        }

        // Create price with per-unit billing
        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: priceInCents,
          currency: 'usd',
          recurring: {
            interval: 'month',
            usage_type: 'licensed',
          },
          billing_scheme: 'per_unit',
          metadata: {
            environment: environment,
            created_via: 'sync-stripe-pricing'
          }
        });

        // Update platform settings with new IDs
        const updateData: any = {};
        if (environment === 'live') {
          updateData.stripe_product_id_live = product.id;
          updateData.stripe_price_id_live = price.id;
        } else {
          updateData.stripe_product_id_test = product.id;
          updateData.stripe_price_id_test = price.id;
        }

        await supabase
          .from('platform_settings')
          .update(updateData)
          .eq('key', 'platform_settings');

        (results as any)[environment] = {
          product_id: product.id,
          price_id: price.id,
          price_amount: priceInCents,
          environment: environment
        };

        console.log(`Successfully created/updated Stripe pricing for ${environment}:`, {
          product_id: product.id,
          price_id: price.id,
          price_amount: priceInCents
        });

      } catch (error) {
        console.error(`Error processing ${environment} environment:`, error);
        results.errors.push(`${environment}: ${getErrorMessage(error)}`);
      }
    }

    return new Response(JSON.stringify({
      success: results.errors.length === 0,
      results,
      message: results.errors.length === 0 
        ? 'Stripe pricing synced successfully for all environments'
        : 'Partial success - some environments failed'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: results.errors.length === 0 ? 200 : 207
    });

  } catch (error) {
    console.error('Sync Stripe pricing error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: getErrorMessage(error),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});