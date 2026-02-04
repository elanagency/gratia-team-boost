import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const GIFTBIT_API_BASE_TESTBED = "https://api-testbed.giftbit.com/papi/v1";
const GIFTBIT_API_BASE_PRODUCTION = "https://api.giftbit.com/papi/v1";

interface RedemptionRequest {
  brandCode: string;
  brandName: string;
  dollarAmount: number;
  recipientEmail: string;
  recipientFirstName: string;
  recipientLastName: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from JWT
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    const body: RedemptionRequest = await req.json();
    const { brandCode, brandName, dollarAmount, recipientEmail, recipientFirstName, recipientLastName } = body;

    console.log(`Processing Giftbit redemption for user ${user.id}:`, {
      brandCode,
      brandName,
      dollarAmount,
      recipientEmail
    });

    // Validate required fields
    if (!brandCode || !dollarAmount || !recipientEmail) {
      throw new Error('Missing required fields: brandCode, dollarAmount, recipientEmail');
    }

    // Get user profile and company info
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id,
        company_id,
        points,
        first_name,
        last_name,
        companies!inner(environment)
      `)
      .eq('id', user.id)
      .eq('status', 'active')
      .single();

    if (profileError || !profile) {
      throw new Error('User profile not found or inactive');
    }

    const companyId = profile.company_id;
    const environment = (profile.companies as any)?.environment === 'live' ? 'production' : 'testbed';

    // Get exchange rate from platform settings
    const { data: settingData } = await supabase
      .from('platform_settings')
      .select('point_exchange_rate')
      .eq('key', 'platform_settings')
      .single();

    const exchangeRate = settingData?.point_exchange_rate || 0.05;
    const pointsRequired = Math.ceil(dollarAmount / exchangeRate);

    console.log(`Exchange rate: ${exchangeRate}, Points required: ${pointsRequired}, User points: ${profile.points}`);

    // Check if user has enough points
    if (profile.points < pointsRequired) {
      throw new Error(`Insufficient points. Required: ${pointsRequired}, Available: ${profile.points}`);
    }

    // Get the appropriate API key based on environment
    const apiKey = environment === 'production' 
      ? Deno.env.get('GIFTBIT_API_KEY')
      : Deno.env.get('GIFTBIT_API_KEY_TESTBED');

    if (!apiKey) {
      throw new Error(`Giftbit API key not configured for ${environment} environment`);
    }

    const apiBase = environment === 'production' ? GIFTBIT_API_BASE_PRODUCTION : GIFTBIT_API_BASE_TESTBED;

    // Generate unique idempotency key
    const idempotencyKey = `redemption-${user.id}-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Calculate expiry (1 year from now)
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    const expiry = expiryDate.toISOString().split('T')[0]; // YYYY-MM-DD format

    // Create direct link via Giftbit API
    const giftbitPayload = {
      brand_code: brandCode,
      price_in_cents: Math.round(dollarAmount * 100),
      id: idempotencyKey,
      expiry: expiry
    };

    console.log('Calling Giftbit direct_links API:', giftbitPayload);

    const giftbitResponse = await fetch(`${apiBase}/direct_links`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(giftbitPayload)
    });

    if (!giftbitResponse.ok) {
      const errorText = await giftbitResponse.text();
      console.error('Giftbit API error:', errorText);
      throw new Error(`Giftbit API error: ${giftbitResponse.status} - ${errorText}`);
    }

    const giftbitData = await giftbitResponse.json();
    console.log('Giftbit response:', giftbitData);

    // Extract the claim link from response
    const directLink = giftbitData.direct_links?.[0];
    if (!directLink) {
      throw new Error('No direct link returned from Giftbit');
    }

    const claimLink = directLink.link_url;
    const giftId = directLink.uuid || idempotencyKey;

    console.log(`Gift created successfully. Gift ID: ${giftId}, Claim link: ${claimLink}`);

    // Deduct points from user
    const { error: pointsError } = await supabase
      .from('profiles')
      .update({ points: profile.points - pointsRequired })
      .eq('id', user.id);

    if (pointsError) {
      console.error('Failed to deduct points:', pointsError);
      // Note: At this point the gift is already created in Giftbit
      // In production, you'd want to handle this more gracefully
      throw new Error('Failed to deduct points after gift creation');
    }

    // Create redemption record
    const { data: redemption, error: redemptionError } = await supabase
      .from('redemptions')
      .insert({
        user_id: user.id,
        company_id: companyId,
        reward_id: brandCode,
        reward_name: brandName,
        points_spent: pointsRequired,
        dollar_amount: dollarAmount,
        status: 'completed',
        provider: 'giftbit',
        giftbit_gift_id: giftId,
        giftbit_order_id: idempotencyKey,
        giftbit_claim_link: claimLink,
        individual_gift_link: claimLink
      })
      .select()
      .single();

    if (redemptionError) {
      console.error('Failed to create redemption record:', redemptionError);
      // Points already deducted and gift created - log but don't fail
    }

    // Create point transaction for audit trail
    await supabase
      .from('point_transactions')
      .insert({
        company_id: companyId,
        sender_profile_id: user.id,
        recipient_profile_id: user.id,
        points: -pointsRequired,
        description: `Redeemed ${brandName} gift card ($${dollarAmount})`,
        structured_message: JSON.stringify({
          type: 'redemption',
          provider: 'giftbit',
          brandCode,
          brandName,
          dollarAmount,
          giftId
        })
      });

    console.log(`Redemption completed successfully for user ${user.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        giftLink: claimLink,
        giftId: giftId,
        pointsSpent: pointsRequired,
        remainingPoints: profile.points - pointsRequired
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Giftbit redemption error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
