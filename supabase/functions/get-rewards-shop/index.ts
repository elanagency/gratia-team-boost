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
  min_price_in_cents?: number;
  max_price_in_cents?: number;
  currency_code?: string;
}

// Get region from request headers (Cloudflare, Vercel, etc.)
function getRegionFromRequest(req: Request): string {
  // Try Cloudflare header first
  const cfCountry = req.headers.get('CF-IPCountry');
  if (cfCountry) {
    console.log(`Detected region from CF-IPCountry: ${cfCountry}`);
    return cfCountry;
  }
  
  // Try Vercel header
  const vercelCountry = req.headers.get('X-Vercel-IP-Country');
  if (vercelCountry) {
    console.log(`Detected region from X-Vercel-IP-Country: ${vercelCountry}`);
    return vercelCountry;
  }
  
  // Default to Australia for the first customer
  console.log('No region header found, defaulting to AU');
  return 'AU';
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

    // Detect user's region from request headers
    const detectedRegion = getRegionFromRequest(req);

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
    // Map company environment to Giftbit environment
    const companyEnvironment = (userData.companies as any)?.environment || 'live';
    // For now, use testbed for testing. In production, map 'live' -> 'production'
    const giftbitEnvironment = companyEnvironment === 'live' ? 'production' : 'testbed';

    console.log(`User company: ${companyId}, environment: ${companyEnvironment}, giftbit env: ${giftbitEnvironment}, region: ${detectedRegion}`);

    // Get exchange rate from platform settings
    const { data: settingData } = await supabase
      .from('platform_settings')
      .select('point_exchange_rate')
      .eq('key', 'platform_settings')
      .single();

    const rate = settingData?.point_exchange_rate || 0.05;

    console.log(`Exchange rate: ${rate}`);

    // Get gift cards from giftbit_brands table
    // Filter by environment and region
    const { data: brandsData, error: brandsError } = await supabase
      .from('giftbit_brands')
      .select('*')
      .eq('environment', giftbitEnvironment)
      .eq('region_code', detectedRegion)
      .eq('is_active', true)
      .order('name');

    if (brandsError) {
      console.error('Error fetching brands:', brandsError);
      throw new Error('Failed to fetch gift cards');
    }

    console.log(`Found ${brandsData?.length || 0} Giftbit brands for region ${detectedRegion}`);

    // If no brands found for the detected region, try AU as fallback
    let finalBrands = brandsData || [];
    if (finalBrands.length === 0 && detectedRegion !== 'AU') {
      console.log('No brands found for detected region, falling back to AU');
      const { data: auBrands } = await supabase
        .from('giftbit_brands')
        .select('*')
        .eq('environment', giftbitEnvironment)
        .eq('region_code', 'AU')
        .eq('is_active', true)
        .order('name');
      finalBrands = auBrands || [];
    }

    // Transform brands to GiftCard format for frontend compatibility
    const giftCards: GiftCard[] = finalBrands.map((brand: any) => {
      // For variable price, use min price as the base
      const basePrice = brand.min_price_in_cents ? brand.min_price_in_cents / 100 : 0;
      const pointsCost = brand.price_is_variable ? 0 : Math.ceil(basePrice / rate);

      return {
        id: brand.id,
        name: brand.name,
        description: brand.description || brand.disclaimer || '',
        points_cost: pointsCost,
        image_url: brand.image_url || '',
        stock: 999,
        company_id: null,
        external_id: brand.brand_code,
        product_url: '',
        brand_name: brand.name,
        price: basePrice,
        price_is_variable: brand.price_is_variable ?? true,
        created_at: brand.created_at,
        min_price_in_cents: brand.min_price_in_cents,
        max_price_in_cents: brand.max_price_in_cents,
        currency_code: brand.currency_code || 'AUD'
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
            environment: companyEnvironment,
            region: detectedRegion,
            provider: 'giftbit'
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
        error: (error instanceof Error ? error.message : 'Internal server error')
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});