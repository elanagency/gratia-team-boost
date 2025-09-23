import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RedemptionRequest {
  rewardId: string;
  rewardName: string;
  dollarAmount: number;
  recipientEmail: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing redemption request...');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('User authenticated:', user.id);

    const { rewardId, rewardName, dollarAmount, recipientEmail }: RedemptionRequest = await req.json();
    
    // Get platform settings for point exchange rate
    const { data: exchangeRateSetting, error: settingError } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'points_to_dollar_exchange_rate')
      .maybeSingle();

    if (settingError) {
      console.error('Error fetching exchange rate:', settingError);
      return new Response(JSON.stringify({ error: 'Failed to fetch exchange rate' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const exchangeRate = exchangeRateSetting?.value ? parseFloat(JSON.parse(exchangeRateSetting.value.toString())) : 0.01;
    const pointsCost = Math.round(dollarAmount / exchangeRate);
    
    console.log('Dollar amount:', dollarAmount, 'Exchange rate:', exchangeRate, 'Points cost:', pointsCost);

    // Get user's profile and company information
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, company_id, points, first_name, last_name')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Profile error:', profileError);
      return new Response(JSON.stringify({ error: 'User profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('User profile found:', profile.id, 'Company:', profile.company_id);

    // Check if user has enough points
    if (profile.points < pointsCost) {
      console.log('Insufficient points:', profile.points, 'required:', pointsCost);
      return new Response(JSON.stringify({ 
        error: 'Insufficient points',
        currentPoints: profile.points,
        requiredPoints: pointsCost
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get company information for environment detection
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('environment')
      .eq('id', profile.company_id)
      .single();

    if (companyError || !company) {
      console.error('Company error:', companyError);
      return new Response(JSON.stringify({ error: 'Company not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Company environment:', company.environment);

    // Determine which API key and base URL to use
    const isLive = company.environment === 'live';
    const goodyApiKey = isLive 
      ? Deno.env.get('GOODY_API_KEY')
      : Deno.env.get('GOODY_API_KEY_SANDBOX');
    const goodyBaseUrl = isLive 
      ? 'https://api.ongoody.com'
      : 'https://api.sandbox.ongoody.com';

    if (!goodyApiKey) {
      console.error('Missing Goody API key for environment:', company.environment);
      return new Response(JSON.stringify({ error: 'API configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Using Goody API:', goodyBaseUrl);

    // Create order batch with Goody API
    const orderBatchPayload = {
      from_name: `${profile.first_name} ${profile.last_name}`.trim(),
      send_method: "link_multiple_custom_list",
      card_id: "d75ffebf-0c71-417c-84f2-32a6b49deea9", // Default card design
      recipients: [{
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: recipientEmail
      }],
      cart: {
        items: [{
          product_id: rewardId,
          quantity: 1,
          variable_price: dollarAmount * 100 // Convert to cents
        }]
      },
      message: "Congratulations on your reward redemption!"
    };

    console.log('Creating order batch with payload:', JSON.stringify(orderBatchPayload, null, 2));

    const goodyResponse = await fetch(`${goodyBaseUrl}/v1/order_batches`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${goodyApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderBatchPayload)
    });

    if (!goodyResponse.ok) {
      const errorText = await goodyResponse.text();
      console.error('Goody API error:', goodyResponse.status, errorText);
      return new Response(JSON.stringify({ 
        error: 'Failed to create gift order',
        details: errorText
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const goodyResult = await goodyResponse.json();
    console.log('Goody order batch created:', goodyResult.id);

    const order = goodyResult.orders_preview?.[0];
    if (!order) {
      console.error('No order created in batch');
      return new Response(JSON.stringify({ error: 'Failed to create order' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Order created:', order.id, 'Gift link:', order.individual_gift_link);

    // Start database transaction
    // First, deduct points from user
    const { error: pointsError } = await supabase
      .from('profiles')
      .update({ points: profile.points - pointsCost })
      .eq('id', user.id);

    if (pointsError) {
      console.error('Failed to deduct points:', pointsError);
      // Note: In a real scenario, you'd want to cancel the Goody order here
      return new Response(JSON.stringify({ error: 'Failed to process point deduction' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create redemption record
    const { data: redemption, error: redemptionError } = await supabase
      .from('redemptions')
      .insert([{
        user_id: user.id,
        company_id: profile.company_id,
        reward_id: rewardId,
        reward_name: rewardName,
        points_spent: pointsCost,
        dollar_amount: dollarAmount,
        status: 'created',
        shipping_address: { email: recipientEmail },
        goody_order_id: order.id,
        goody_order_batch_id: goodyResult.id,
        individual_gift_link: order.individual_gift_link
      }])
      .select()
      .single();

    if (redemptionError) {
      console.error('Failed to create redemption record:', redemptionError);
      // Rollback points deduction
      await supabase
        .from('profiles')
        .update({ points: profile.points })
        .eq('id', user.id);
      
      return new Response(JSON.stringify({ error: 'Failed to save redemption' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create point transaction record for audit trail
    const { error: transactionError } = await supabase
      .from('point_transactions')
      .insert([{
        company_id: profile.company_id,
        sender_profile_id: user.id,
        recipient_profile_id: user.id,
        points: -pointsCost,
        description: `Redeemed $${dollarAmount} ${rewardName} for ${pointsCost} points`
      }]);

    if (transactionError) {
      console.error('Failed to create transaction record:', transactionError);
      // Note: This is for audit only, so we don't rollback the entire transaction
    }

    console.log('Redemption completed successfully:', redemption.id);

    return new Response(JSON.stringify({
      success: true,
      redemption: {
        id: redemption.id,
        giftLink: redemption.individual_gift_link,
        status: redemption.status,
        rewardName: redemption.reward_name
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in goody-redemption-service:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});