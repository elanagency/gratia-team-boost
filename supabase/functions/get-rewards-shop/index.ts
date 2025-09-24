import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

interface GiftCard {
  id: string;
  name: string;
  description: string;
  points_cost: number;
  image_url: string;
  stock: number;
  company_id?: string | null;
  external_id: string;
  product_url: string;
  brand_name: string;
  price: number;
  price_is_variable: boolean;
  created_at?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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

    console.log(`Fetching rewards shop data for user: ${user.id}`);

    // Single query to get all needed data
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select(`
        company_id,
        companies!inner(environment)
      `)
      .eq('id', user.id)
      .eq('status', 'active')
      .single();

    if (userError || !userData) {
      throw new Error('User profile not found or inactive');
    }

    const companyId = userData.company_id;
    const environment = userData.companies.environment || 'live';

    console.log(`User company: ${companyId}, environment: ${environment}`);

    // Get exchange rate setting
    const { data: settingData, error: settingError } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'point_exchange_rate')
      .single();

    const rate = settingError ? 0.03 : (settingData?.value || 0.03);

    console.log(`Exchange rate: ${rate}`);

    // Get blacklisted product IDs first
    const { data: blacklistData } = await supabase
      .from('platform_product_blacklist')
      .select('goody_product_id');

    const blacklistedProductIds = blacklistData?.map(item => item.goody_product_id) || [];

    console.log(`Found ${blacklistedProductIds.length} blacklisted products`);

    // Get gift cards for the environment, excluding blacklisted products
    let giftCardsQuery = supabase
      .from('goody_gift_cards')
      .select('*')
      .eq('environment', environment)
      .eq('is_active', true);

    // Apply blacklist filter if there are blacklisted products
    if (blacklistedProductIds.length > 0) {
      giftCardsQuery = giftCardsQuery.not('goody_product_id', 'in', `(${blacklistedProductIds.join(',')})`);
    }

    const { data: giftCardsData, error: giftCardsError } = await giftCardsQuery.order('name');

    if (giftCardsError) {
      console.error('Error fetching gift cards:', giftCardsError);
      throw new Error('Failed to fetch gift cards');
    }

    console.log(`Found ${giftCardsData?.length || 0} gift cards`);

    // Transform gift cards with calculated points
    const giftCards: GiftCard[] = (giftCardsData || []).map((card: any) => {
      const isVariablePrice = card.price_is_variable || false;
      const pointsCost = isVariablePrice ? 0 : Math.ceil((card.price || 0) / rate);

      return {
        id: card.id,
        name: card.name,
        description: card.subtitle || card.description || '',
        points_cost: pointsCost,
        image_url: card.image_url || '',
        stock: 999,
        company_id: null,
        external_id: card.goody_product_id,
        product_url: '',
        brand_name: card.brand_name || '',
        price: card.price || 0,
        price_is_variable: isVariablePrice,
        created_at: new Date().toISOString()
      };
    });

    console.log(`Returning ${giftCards.length} transformed gift cards`);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          giftCards,
          exchangeRate: rate,
          userContext: {
            companyId,
            environment
          }
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Internal server error'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});