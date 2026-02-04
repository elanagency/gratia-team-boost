import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const GIFTBIT_API_BASE_TESTBED = "https://api-testbed.giftbit.com/papi/v1";
const GIFTBIT_API_BASE_PRODUCTION = "https://api.giftbit.com/papi/v1";

// Currency mapping for regions
const REGION_CURRENCIES: Record<string, string> = {
  'CA': 'CAD',
  'US': 'USD',
  'AU': 'AUD',
  'GB': 'GBP',
  'NZ': 'NZD',
  'GLBL': 'USD',
  'EU': 'EUR',
  'FR': 'EUR',
  'DE': 'EUR',
  'IT': 'EUR',
  'ES': 'EUR',
  'NL': 'EUR',
  'BE': 'EUR',
  'AT': 'EUR',
  'IE': 'EUR',
  'PT': 'EUR',
  'FI': 'EUR',
  'GR': 'EUR',
  'LU': 'EUR',
  'MT': 'EUR',
  'SK': 'EUR',
  'SI': 'EUR',
  'EE': 'EUR',
  'LV': 'EUR',
  'LT': 'EUR',
  'CY': 'EUR',
  'HR': 'EUR',
  'JP': 'JPY',
  'SG': 'SGD',
  'HK': 'HKD',
  'IN': 'INR',
  'MX': 'MXN',
  'BR': 'BRL',
  'ZA': 'ZAR',
  'AE': 'AED',
  'SE': 'SEK',
  'NO': 'NOK',
  'DK': 'DKK',
  'CH': 'CHF',
  'PL': 'PLN',
  'CZ': 'CZK',
  'HU': 'HUF',
  'RO': 'RON',
  'TR': 'TRY',
  'KR': 'KRW',
  'TW': 'TWD',
  'TH': 'THB',
  'MY': 'MYR',
  'PH': 'PHP',
  'ID': 'IDR',
  'VN': 'VND',
  'CL': 'CLP',
  'CO': 'COP',
  'AR': 'ARS',
  'PE': 'PEN',
};

// Extract region code from image URL or derive from name
function extractRegionCode(imageUrl: string | undefined, name: string): string {
  // Extract from image URL like ".../flags/CA@3x.png" → "CA"
  if (imageUrl) {
    const match = imageUrl.match(/flags\/([A-Za-z]+)@/);
    if (match) return match[1].toUpperCase();
  }
  
  // Fallback: derive from name using a mapping
  const nameMap: Record<string, string> = {
    'Canada': 'CA',
    'USA': 'US',
    'United States': 'US',
    'Australia': 'AU',
    'Global': 'GLBL',
    'United Kingdom': 'GB',
    'New Zealand': 'NZ',
    'Japan': 'JP',
    'Singapore': 'SG',
    'Hong Kong': 'HK',
    'India': 'IN',
    'Mexico': 'MX',
    'Brazil': 'BR',
    'South Africa': 'ZA',
    'Germany': 'DE',
    'France': 'FR',
    'Italy': 'IT',
    'Spain': 'ES',
    'Netherlands': 'NL',
    'Belgium': 'BE',
    'Austria': 'AT',
    'Ireland': 'IE',
    'Portugal': 'PT',
    'Finland': 'FI',
    'Sweden': 'SE',
    'Norway': 'NO',
    'Denmark': 'DK',
    'Switzerland': 'CH',
    'Poland': 'PL',
    'Czech Republic': 'CZ',
    'Hungary': 'HU',
    'Romania': 'RO',
    'Turkey': 'TR',
    'South Korea': 'KR',
    'Taiwan': 'TW',
    'Thailand': 'TH',
    'Malaysia': 'MY',
    'Philippines': 'PH',
    'Indonesia': 'ID',
    'Vietnam': 'VN',
    'Chile': 'CL',
    'Colombia': 'CO',
    'Argentina': 'AR',
    'Peru': 'PE',
    'Europe': 'EU',
    'European Union': 'EU',
    'UAE': 'AE',
    'United Arab Emirates': 'AE',
  };
  
  return nameMap[name] || name.substring(0, 2).toUpperCase();
}

interface GiftbitBrand {
  brand_code: string;
  name: string;
  description: string;
  disclaimer: string;
  image_url: string;
  min_price_in_cents: number;
  max_price_in_cents: number;
  allowed_prices_in_cents: number[];
  variable_price: boolean;
  currency_code: string;
}

// Giftbit API returns regions with: id, name, image_url
interface GiftbitApiRegion {
  id: number;
  name: string;
  image_url: string;
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

    const { action, environment = 'testbed', region = 'AU' } = await req.json();
    
    console.log(`Giftbit brand service: action=${action}, environment=${environment}, region=${region}`);

    // Get the appropriate API key based on environment
    const apiKey = environment === 'production' 
      ? Deno.env.get('GIFTBIT_API_KEY')
      : Deno.env.get('GIFTBIT_API_KEY_TESTBED');

    if (!apiKey) {
      throw new Error(`Giftbit API key not configured for ${environment} environment`);
    }

    const apiBase = environment === 'production' ? GIFTBIT_API_BASE_PRODUCTION : GIFTBIT_API_BASE_TESTBED;

    switch (action) {
      case 'PING': {
        // Test API connectivity
        const response = await fetch(`${apiBase}/ping`, {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        const data = await response.json();
        console.log('Giftbit ping response:', data);
        
        return new Response(
          JSON.stringify({ success: true, data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'GET_REGIONS': {
        // Fetch available regions from Giftbit
        const response = await fetch(`${apiBase}/regions`, {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Giftbit regions error:', errorText);
          throw new Error(`Failed to fetch regions: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`Fetched ${data.regions?.length || 0} regions from Giftbit`);
        
        return new Response(
          JSON.stringify({ success: true, regions: data.regions || [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'GET_BRANDS': {
        // Look up the Giftbit region ID from the database
        const { data: regionData, error: regionError } = await supabase
          .from('giftbit_regions')
          .select('giftbit_region_id')
          .eq('region_code', region)
          .eq('environment', environment)
          .single();

        if (regionError || !regionData?.giftbit_region_id) {
          console.error(`Region ${region} not found or missing giftbit_region_id:`, regionError);
          throw new Error(`Region ${region} not found. Please sync regions first using "Refresh Regions".`);
        }

        const giftbitRegionId = regionData.giftbit_region_id;
        console.log(`Resolved region ${region} to Giftbit API region ID: ${giftbitRegionId}`);

        // Fetch ALL brands for a specific region with pagination
        let allBrands: GiftbitBrand[] = [];
        let offset = 0;
        const limit = 100;
        let hasMore = true;

        console.log(`Fetching all brands for region ${region} (ID: ${giftbitRegionId}) with pagination...`);

        while (hasMore) {
          const url = `${apiBase}/brands?region=${giftbitRegionId}&limit=${limit}&offset=${offset}`;
          console.log(`Fetching brands page: region=${region} (ID: ${giftbitRegionId}), offset=${offset}, limit=${limit}`);
          
          const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${apiKey}` }
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('Giftbit brands error:', errorText);
            throw new Error(`Failed to fetch brands: ${response.status}`);
          }
          
          const data = await response.json();
          const brands: GiftbitBrand[] = data.brands || [];
          const totalCount = data.total_count || 0;
          
          allBrands = allBrands.concat(brands);
          offset += limit;
          hasMore = offset < totalCount;
          
          console.log(`Page fetched: ${brands.length} brands, total so far: ${allBrands.length}/${totalCount}`);
        }

        console.log(`Fetched all ${allBrands.length} brands for region ${region}`);
        
        return new Response(
          JSON.stringify({ success: true, brands: allBrands, total: allBrands.length }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'SYNC_REGIONS': {
        // Sync regions from Giftbit API to database
        const response = await fetch(`${apiBase}/regions`, {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch regions: ${response.status}`);
        }
        
        const data = await response.json();
        // Giftbit API returns: { id, name, image_url } - NOT region_code or currency_code
        const apiRegions: GiftbitApiRegion[] = data.regions || [];
        
        console.log(`Fetched ${apiRegions.length} regions from Giftbit API`);
        console.log('Sample region:', JSON.stringify(apiRegions[0]));
        
        let syncedCount = 0;
        let errorCount = 0;
        
        for (const apiRegion of apiRegions) {
          // Extract region code from image_url or derive from name
          const regionCode = extractRegionCode(apiRegion.image_url, apiRegion.name);
          const currencyCode = REGION_CURRENCIES[regionCode] || 'USD';
          
          console.log(`Processing region: ${apiRegion.name} -> ${regionCode} (${currencyCode}), giftbit_region_id: ${apiRegion.id}`);
          
          const { error } = await supabase
            .from('giftbit_regions')
            .upsert({
              giftbit_region_id: apiRegion.id,  // Store the numeric Giftbit API region ID
              region_code: regionCode,
              name: apiRegion.name,
              image_url: apiRegion.image_url,
              currency_code: currencyCode,
              environment,
              is_active: true
            }, { onConflict: 'region_code,environment' });
          
          if (error) {
            console.error(`Error syncing region ${regionCode}:`, error);
            errorCount++;
          } else {
            syncedCount++;
          }
        }
        
        console.log(`Successfully synced ${syncedCount} regions, ${errorCount} errors`);
        
        return new Response(
          JSON.stringify({ success: true, synced: syncedCount, errors: errorCount }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'SYNC_BRANDS': {
        // Look up the Giftbit region ID from the database
        const { data: regionData, error: regionError } = await supabase
          .from('giftbit_regions')
          .select('giftbit_region_id')
          .eq('region_code', region)
          .eq('environment', environment)
          .single();

        if (regionError || !regionData?.giftbit_region_id) {
          console.error(`Region ${region} not found or missing giftbit_region_id:`, regionError);
          throw new Error(`Region ${region} not found. Please sync regions first using "Refresh Regions".`);
        }

        const giftbitRegionId = regionData.giftbit_region_id;
        console.log(`Resolved region ${region} to Giftbit API region ID: ${giftbitRegionId}`);

        // Sync ALL brands for a specific region from Giftbit API to database with pagination
        let allBrands: GiftbitBrand[] = [];
        let offset = 0;
        const limit = 100;
        let hasMore = true;

        console.log(`Starting full brand sync for region ${region} (ID: ${giftbitRegionId}) with pagination...`);

        while (hasMore) {
          const url = `${apiBase}/brands?region=${giftbitRegionId}&limit=${limit}&offset=${offset}`;
          console.log(`Fetching brands page: region=${region} (ID: ${giftbitRegionId}), offset=${offset}, limit=${limit}`);
          
          const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${apiKey}` }
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('Giftbit sync error:', errorText);
            throw new Error(`Failed to fetch brands: ${response.status}`);
          }
          
          const data = await response.json();
          const brands: GiftbitBrand[] = data.brands || [];
          const totalCount = data.total_count || 0;
          
          allBrands = allBrands.concat(brands);
          offset += limit;
          hasMore = offset < totalCount;
          
          console.log(`Page fetched: ${brands.length} brands, total so far: ${allBrands.length}/${totalCount}`);
        }

        console.log(`Syncing ${allBrands.length} total brands for region ${region}`);
        
        let syncedCount = 0;
        let errorCount = 0;
        
        for (const brand of allBrands) {
          const { error } = await supabase
            .from('giftbit_brands')
            .upsert({
              brand_code: brand.brand_code,
              name: brand.name,
              description: brand.description || '',
              disclaimer: brand.disclaimer || '',
              image_url: brand.image_url || '',
              min_price_in_cents: brand.min_price_in_cents,
              max_price_in_cents: brand.max_price_in_cents,
              allowed_prices_in_cents: brand.allowed_prices_in_cents || [],
              price_is_variable: brand.variable_price ?? true,
              currency_code: brand.currency_code || REGION_CURRENCIES[region] || 'USD',
              region_code: region,
              environment,
              is_active: true,
              last_synced_at: new Date().toISOString(),
              brand_data: brand
            }, { onConflict: 'brand_code,region_code,environment' });
          
          if (error) {
            console.error(`Error syncing brand ${brand.brand_code}:`, error);
            errorCount++;
          } else {
            syncedCount++;
          }
        }
        
        console.log(`Synced ${syncedCount} brands, ${errorCount} errors`);
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            synced: syncedCount, 
            errors: errorCount,
            total: allBrands.length 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'GET_FUNDS': {
        // Check account balance
        const response = await fetch(`${apiBase}/funds`, {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch funds: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Giftbit funds:', data);
        
        return new Response(
          JSON.stringify({ success: true, funds: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error('Giftbit brand service error:', error);
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
