import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getErrorMessage, createErrorResponse } from "../_shared/error-utils.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GoodyProduct {
  id: string;
  name: string;
  brand: {
    id: string;
    name: string;
    shipping_price: number;
  };
  subtitle?: string;
  subtitle_short?: string;
  recipient_description: string;
  variants_label?: string;
  variants_num_selectable?: number;
  variants: Array<{
    id: string;
    name: string;
    subtitle: string;
    price_cents: number;
    image_large: {
      url: string;
      width: number;
      height: number;
    };
  }>;
  images: Array<{
    id: string;
    image_large: {
      url: string;
      width: number;
      height: number;
    };
  }>;
  price: number;
  price_is_variable: boolean;
  restricted_states: string[];
}

// Utility function to check if a product is a gift card
const isGiftCard = (product: GoodyProduct): boolean => {
  const searchTerms = ['gift card', 'gift certificate', 'egift'];
  const subtitle = (product.subtitle || '').toLowerCase();
  const description = (product.recipient_description || '').toLowerCase();
  const name = (product.name || '').toLowerCase();

  return searchTerms.some(term => 
    subtitle.includes(term) || description.includes(term) || name.includes(term)
  );
};

// Utility function to check if a product is a gift card with brand confirmation
const isGiftCardByBrand = (product: GoodyProduct): boolean => {
  const GIFT_CARD_BRAND_ID = '84b0c3a9-b51c-4f0c-babe-117a0c6b353b';
  const GIFT_CARD_BRAND_NAME = 'Gift Cards';
  
  // Double confirmation: brand ID and brand name
  return product.brand?.id === GIFT_CARD_BRAND_ID && 
         product.brand?.name === GIFT_CARD_BRAND_NAME;
};

interface GoodyApiResponse {
  data: GoodyProduct[];
  list_meta: {
    total_count: number;
  };
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

    console.log('GOODY_API_KEY is configured:', Deno.env.get('GOODY_API_KEY') ? 'Yes' : 'No');
    console.log('GOODY_API_KEY_SANDBOX is configured:', Deno.env.get('GOODY_API_KEY_SANDBOX') ? 'Yes' : 'No');

    // Handle GET and POST requests for fetching products
    if (req.method === 'GET' || req.method === 'POST') {
      let pageNum = 1;
      let perPage = 50;
      let environment = 'live';
      let isProductFetch = true;
      let fetchAll = false;
      
      if (req.method === 'GET') {
        const url = new URL(req.url);
        pageNum = parseInt(url.searchParams.get('page') || '1');
        perPage = parseInt(url.searchParams.get('per_page') || '50');
        environment = url.searchParams.get('environment') || 'live';
        fetchAll = url.searchParams.get('fetch_all') === 'true';
      } else if (req.method === 'POST') {
        try {
          const body = await req.json();
          environment = body.environment || 'live';
          
          // Determine base URL and API key based on environment
          const isLive = environment === 'live';
          const baseUrl = isLive ? 'https://api.ongoody.com' : 'https://api.sandbox.ongoody.com';
          const apiKey = isLive ? Deno.env.get('GOODY_API_KEY') : Deno.env.get('GOODY_API_KEY_SANDBOX');

          if (!apiKey) {
            console.error(`${isLive ? 'GOODY_API_KEY' : 'GOODY_API_KEY_SANDBOX'} environment variable not found`);
            throw new Error(`${isLive ? 'GOODY_API_KEY' : 'GOODY_API_KEY_SANDBOX'} not configured`);
          }
          
          // Handle GET_GOODY_PRODUCTS method - Pure API fetching
          if (body.method === 'GET_GOODY_PRODUCTS') {
            console.log(`Fetching all products from Goody API for ${environment} environment...`);
            return await getGoodyProducts(supabase, baseUrl, apiKey, environment);
          }
          
          // Handle GET_GIFT_CARDS_FROM_DB method - Admin catalog filtering
          if (body.method === 'GET_GIFT_CARDS_FROM_DB') {
            console.log(`Loading gift cards from database for admin catalog in ${environment} environment...`);
            return await getGiftCardsProductsFromDB(supabase, body.page || 1, body.per_page || 20, environment);
          }

          // Legacy support for existing methods
          if (body.method === 'SYNC') {
            console.log(`Starting gift card sync for ${environment} environment...`);
            return await getGoodyProducts(supabase, baseUrl, apiKey, environment);
          }
          
          // Handle LOAD_FROM_IDS method  
          if (body.method === 'LOAD_FROM_IDS') {
            console.log('Loading products from saved IDs...');
            return await handleLoadFromSavedIds(supabase, baseUrl, apiKey, body.product_ids, environment);
          }
          
          // Handle LOAD_FROM_DB method  
          if (body.method === 'LOAD_FROM_DB') {
            console.log(`Loading products from database for ${environment} environment...`);
            return await handleLoadFromDatabase(supabase, body.page || 1, body.per_page || 20, environment);
          }
          
          // Handle DIRECT_API_LOAD method for brand-filtered direct API calls
          if (body.method === 'DIRECT_API_LOAD') {
            console.log(`Direct API loading gift cards for ${environment} environment...`);
            return await handleDirectGiftCardLoad(baseUrl, apiKey, body.page || 1, body.per_page || 20, environment);
          }
          
          // Check if this is a product fetch request
          if (body.method === 'GET' || (!body.productIds && !body.pointsMultiplier && !body.method)) {
            // This is a product fetch request
            pageNum = body.page || 1;
            perPage = body.per_page || 50;
            fetchAll = body.fetch_all || false;
          } else {
            // This is an add products request
            isProductFetch = false;
            const { productIds, pointsMultiplier = 1 } = body;
            
            if (!Array.isArray(productIds) || productIds.length === 0) {
              throw new Error('Product IDs are required');
            }

            console.log(`Adding ${productIds.length} products with points multiplier: ${pointsMultiplier}`);

            // Return success since we're not storing products in DB anymore
            return new Response(
              JSON.stringify({ 
                success: true, 
                message: `Product settings will be managed through platform settings`,
                productIds: productIds 
              }),
              { 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200 
              }
            );
          }
        } catch (parseError) {
          console.error('Error parsing request body:', parseError);
          throw new Error('Invalid request body');
        }
      }

      if (isProductFetch) {
        // Determine base URL and API key based on environment
        const isLive = environment === 'live';
        const baseUrl = isLive ? 'https://api.ongoody.com' : 'https://api.sandbox.ongoody.com';
        const apiKey = isLive ? Deno.env.get('GOODY_API_KEY') : Deno.env.get('GOODY_API_KEY_SANDBOX');

        if (!apiKey) {
          console.error(`${isLive ? 'GOODY_API_KEY' : 'GOODY_API_KEY_SANDBOX'} environment variable not found`);
          throw new Error(`${isLive ? 'GOODY_API_KEY' : 'GOODY_API_KEY_SANDBOX'} not configured`);
        }

        if (fetchAll) {
          console.log(`Fetching all Goody products from ${environment} environment across all pages...`);
          const allProducts: GoodyProduct[] = [];
          let currentPage = 1;
          let totalCount = 0;
          
          while (true) {
            console.log(`Fetching page ${currentPage}...`);
            
            const goodyResponse = await fetch(
              `${baseUrl}/v1/products?page=${currentPage}&per_page=${perPage}`,
              {
                headers: {
                  'Authorization': `Bearer ${apiKey}`,
                  'Content-Type': 'application/json',
                },
              }
            );

            if (!goodyResponse.ok) {
              const errorText = await goodyResponse.text();
              console.error('Goody API error response:', errorText);
              
              if (goodyResponse.status === 401) {
                throw new Error(`Goody API authentication failed. Please check your API key. Status: ${goodyResponse.status}`);
              }
              
              throw new Error(`Goody API error: ${goodyResponse.status} ${errorText}`);
            }

            const pageData: GoodyApiResponse = await goodyResponse.json();
            // Filter for gift cards only
            const giftCards = pageData.data.filter(isGiftCard);
            allProducts.push(...giftCards);
            totalCount = pageData.list_meta.total_count;
            
            console.log(`Fetched ${pageData.data.length} products from page ${currentPage}. Total so far: ${allProducts.length}`);
            
            // Break if we've fetched all products or this page was empty
            if (pageData.data.length === 0 || allProducts.length >= totalCount) {
              break;
            }
            
            currentPage++;
          }
          
          console.log(`Successfully fetched all ${allProducts.length} products from Goody ${environment} environment across ${currentPage} pages`);

          return new Response(
            JSON.stringify({
              data: allProducts,
              list_meta: {
                total_count: totalCount
              }
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200 
            }
          );
        } else {
          console.log(`Fetching Goody catalog from ${environment} - page: ${pageNum}, per_page: ${perPage}`);
          console.log(`Using API key starting with: ${apiKey.substring(0, 10)}...`);

          const goodyResponse = await fetch(
            `${baseUrl}/v1/products?page=${pageNum}&per_page=${perPage}`,
            {
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
              },
            }
          );

          console.log(`Goody API response status: ${goodyResponse.status}`);

          if (!goodyResponse.ok) {
            const errorText = await goodyResponse.text();
            console.error('Goody API error response:', errorText);
            
            if (goodyResponse.status === 401) {
              throw new Error(`Goody API authentication failed. Please check your API key. Status: ${goodyResponse.status}`);
            }
            
            throw new Error(`Goody API error: ${goodyResponse.status} ${errorText}`);
          }

          const goodyData: GoodyApiResponse = await goodyResponse.json();
          // Filter for gift cards only
          const giftCards = goodyData.data.filter(isGiftCard);
          console.log(`Successfully fetched ${giftCards.length} gift cards from ${goodyData.data.length} total products`);

          return new Response(
            JSON.stringify({
              data: giftCards,
              list_meta: {
                total_count: giftCards.length
              }
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200 
            }
          );
        }
      }
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405 
      }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ 
        error: getErrorMessage(error) || 'Internal server error',
        details: getErrorMessage(error)
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

// Pure API function to fetch ALL products from Goody API (no filtering)
async function getGoodyProducts(supabaseClient: any, baseUrl: string, apiKey: string, environment: string = 'live') {
  console.log(`Starting product fetch from Goody API for ${environment} environment...`);
  
  const allProducts = [];
  let page = 1;
  let hasMorePages = true;
  let totalFetched = 0;
  let retryCount = 0;
  const maxRetries = 3;
  const retryDelay = 1000; // 1 second base delay

  // Validate API key first
  if (!apiKey || apiKey.trim() === '') {
    console.error(`API key for ${environment} is empty or invalid`);
    return new Response(
      JSON.stringify({ 
        error: 'API Configuration Error', 
        details: `API key for ${environment} environment is not properly configured. Please check your edge function secrets.`,
        error_code: 'MISSING_API_KEY'
      }),
      { status: 400, headers: corsHeaders }
    );
  }

  // Test API connectivity first
  try {
    console.log('Testing API connectivity...');
    const testResponse = await fetch(`${baseUrl}/v1/products?page=1&per_page=1`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
    });

    if (!testResponse.ok) {
      const errorText = await testResponse.text();
      console.error('API connectivity test failed:', testResponse.status, errorText);
      
      if (testResponse.status === 401) {
        return new Response(
          JSON.stringify({ 
            error: 'Authentication Failed', 
            details: `Invalid API key for ${environment} environment. Please verify your API key in the edge function secrets.`,
            error_code: 'INVALID_API_KEY'
          }),
          { status: 401, headers: corsHeaders }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'API Connection Failed', 
          details: `Goody API returned ${testResponse.status}: ${errorText}`,
          error_code: 'API_CONNECTION_FAILED'
        }),
        { status: 503, headers: corsHeaders }
      );
    }
    console.log('API connectivity test passed');
  } catch (error) {
    console.error('API connectivity test error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Network Error', 
        details: `Unable to connect to Goody API: ${getErrorMessage(error)}`,
        error_code: 'NETWORK_ERROR'
      }),
      { status: 503, headers: corsHeaders }
    );
  }

  let progressLogCounter = 0;
  const maxPages = 60; // Safety limit to prevent infinite loops

  try {
    while (hasMorePages && page <= maxPages) {
      console.log(`Fetching page ${page}... (attempt ${retryCount + 1})`);
      
      try {
        const response = await fetch(`${baseUrl}/v1/products?page=${page}&per_page=100`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'application/json',
          },
          signal: AbortSignal.timeout(30000), // 30 second timeout
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }

        const data = await response.json() as GoodyApiResponse;
        
        // Validate response structure
        if (!data || !Array.isArray(data.data)) {
          throw new Error('Invalid response structure from Goody API');
        }

        console.log(`Page ${page}: ${data.data.length} total products received`);

        // Check for natural termination - no more products returned
        if (data.data.length === 0) {
          console.log(`Reached end of available products at page ${page} - API returned 0 results`);
          hasMorePages = false;
          break;
        }

        // Store ALL products without any filtering
        const pageProducts = data.data;
        
        console.log(`Page ${page}: ${pageProducts.length} products stored`);
        
        allProducts.push(...pageProducts);
        totalFetched += data.data.length;
        
        console.log(`Fetched ${data.data.length} products from page ${page}. Total products so far: ${allProducts.length}`);
        
        // Progress logging every 10 pages
        progressLogCounter++;
        if (progressLogCounter % 10 === 0) {
          console.log(`Progress: Processed ${page} pages, ${totalFetched} total products, stored ${allProducts.length} products so far`);
        }
        
        // Check if there are more pages (less than 100 means we're at the end)
        hasMorePages = data.data.length === 100;
        page++;

        // Reset retry count on success
        retryCount = 0;

        // Small delay to be respectful to the API
        if (page % 50 === 0) {
          await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay every 50 pages
        } else {
          // Progressive delay to avoid rate limiting
          const delay = Math.min(50 + (page * 5), 200);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

      } catch (pageError) {
        console.error(`Error fetching page ${page}:`, pageError);
        
        if (retryCount < maxRetries) {
          retryCount++;
          const delay = retryDelay * Math.pow(2, retryCount - 1); // Exponential backoff
          console.log(`Retrying page ${page} in ${delay}ms (attempt ${retryCount}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue; // Retry the same page
        } else {
          console.error(`Failed to fetch page ${page} after ${maxRetries} attempts, stopping sync`);
          throw new Error(`Failed to fetch page ${page}: ${getErrorMessage(pageError)}`);
        }
      }
    }

    // Log final aggregation results
    if (page > maxPages) {
      console.log(`SAFETY LIMIT REACHED: Stopped at ${maxPages} pages (${totalFetched} products). Consider increasing maxPages if needed.`);
    } else {
      console.log(`NATURAL TERMINATION: API returned 0 results at page ${page}`);
    }

    console.log(`Product fetch complete. Found ${allProducts.length} products out of ${totalFetched} total products.`);

    if (allProducts.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: `No products found in the ${environment} catalog`,
          total_found: 0,
          total_saved: 0,
          sync_timestamp: new Date().toISOString()
        }),
        { headers: corsHeaders }
      );
    }

    // Prepare product records for database with full product data including brand_id
    // Map sandbox environment to 'test' for database storage
    const dbEnvironment = environment === 'sandbox' ? 'test' : environment;
    
    const productRecords = allProducts.map(product => {
      try {
        return {
          goody_product_id: product.id,
          name: product.name || 'Unknown Product',
          brand_name: product.brand?.name || 'Unknown Brand',
          brand_id: product.brand?.id || null,
          price: product.variants?.[0]?.price_cents || 0,
          price_is_variable: product.price_is_variable || false,
          image_url: product.images?.[0]?.image_large?.url || product.variants?.[0]?.image_large?.url || null,
          description: product.recipient_description || '',
          subtitle: product.subtitle || '',
          product_data: product, // Store full product JSON
          environment: dbEnvironment,
          last_synced_at: new Date().toISOString(),
          is_active: true
        };
      } catch (recordError) {
        console.error('Error preparing record for product:', product.id, recordError);
        return null;
      }
    }).filter(record => record !== null);

    console.log(`Prepared ${productRecords.length} valid records for database insertion`);

    // Step 1: Clear existing records for this environment and insert new ones to goody_products
    try {
      const { error: deleteError } = await supabaseClient
        .from('goody_products')
        .delete()
        .eq('environment', dbEnvironment);

      if (deleteError) {
        console.error(`Error clearing existing ${environment} product records:`, deleteError);
        throw new Error(`Database cleanup failed: ${deleteError.message}`);
      }

      // Insert new records in batches with error tracking
      const batchSize = 50; // Reduced batch size for better reliability
      let insertedCount = 0;
      let failedBatches = 0;
      
      for (let i = 0; i < productRecords.length; i += batchSize) {
        const batch = productRecords.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;
        
        try {
          const { error: insertError } = await supabaseClient
            .from('goody_products')
            .upsert(batch, { 
              onConflict: 'goody_product_id,environment' 
            });

          if (insertError) {
            console.error(`Error inserting batch ${batchNumber}:`, insertError);
            failedBatches++;
          } else {
            insertedCount += batch.length;
            console.log(`Inserted batch ${batchNumber}: ${batch.length} records to goody_products`);
          }
        } catch (batchError) {
          console.error(`Batch ${batchNumber} insertion failed:`, batchError);
          failedBatches++;
        }

        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const totalBatches = Math.ceil(productRecords.length / batchSize);
      console.log(`Step 1 complete. Inserted: ${insertedCount} products to goody_products, Failed batches: ${failedBatches}/${totalBatches}`);

      // Step 2: Sync gift cards from goody_products to goody_gift_cards
      console.log(`Step 2: Syncing gift cards from goody_products to goody_gift_cards for ${environment} environment...`);
      
      try {
        const { data: giftCardSyncCount, error: giftCardSyncError } = await supabaseClient
          .rpc('sync_gift_cards_from_products', { target_environment: dbEnvironment });

        if (giftCardSyncError) {
          console.error('Gift card sync error:', giftCardSyncError);
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Gift card sync failed',
              details: giftCardSyncError.message,
              total_products_synced: insertedCount
            }),
            { status: 500, headers: corsHeaders }
          );
        }

        console.log(`Step 2 complete. Synced ${giftCardSyncCount} gift cards to goody_gift_cards`);

        return new Response(
          JSON.stringify({
            success: true,
            message: `Two-step sync completed successfully for ${environment} environment`,
            total_products_found: allProducts.length,
            total_products_saved: insertedCount,
            gift_cards_synced: giftCardSyncCount,
            failed_batches: failedBatches,
            sync_timestamp: new Date().toISOString(),
            environment: environment,
            db_environment: dbEnvironment
          }),
          { headers: corsHeaders }
        );

      } catch (syncError) {
        console.error('Unexpected error during gift card sync:', syncError);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Gift card sync failed',
            details: getErrorMessage(syncError),
            total_products_synced: insertedCount
          }),
          { status: 500, headers: corsHeaders }
        );
      }

    } catch (dbError) {
      console.error('Database operation error:', dbError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Database Error',
          details: `Failed to save products to database: ${getErrorMessage(dbError)}`,
          error_code: 'DATABASE_ERROR'
        }),
        { status: 500, headers: corsHeaders }
      );
    }

  } catch (error) {
    console.error('Sync process error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Sync Failed',
        details: getErrorMessage(error),
        total_found: allProducts.length,
        sync_timestamp: new Date().toISOString()
      }),
      { status: 500, headers: corsHeaders }
    );
  }
}

async function handleLoadFromSavedIds(supabaseClient: any, baseUrl: string, apiKey: string, productIds?: string[], environment: string = 'live'): Promise<Response> {
  console.log(`Loading products from saved IDs for ${environment} environment...`);
  
  try {
    // Get saved product IDs from our database if not provided
    if (!productIds) {
      const { data: savedProducts, error: fetchError } = await supabaseClient
        .from('goody_gift_cards')
        .select('goody_product_id')
        .eq('is_active', true)
        .eq('environment', environment);

      if (fetchError) {
        console.error('Error fetching saved product IDs:', fetchError);
        throw new Error(`Failed to fetch saved product IDs: ${fetchError.message}`);
      }

      productIds = savedProducts?.map((p: any) => p.goody_product_id) || [];
    }

    if (!productIds || productIds.length === 0) {
      return new Response(
        JSON.stringify({
          data: [],
          list_meta: { total_count: 0 },
          message: `No saved product IDs found for ${environment} environment`
        }),
        { headers: corsHeaders }
      );
    }

    console.log(`Fetching details for ${productIds.length} saved products from Goody API...`);
    
    const products: GoodyProduct[] = [];
    const batchSize = 10; // Process in smaller batches to avoid overwhelming the API
    
    for (let i = 0; i < productIds.length; i += batchSize) {
      const batch = productIds.slice(i, i + batchSize);
      const batchPromises = batch.map(async (productId) => {
        try {
          const response = await fetch(`${baseUrl}/v1/products/${productId}`, {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Accept': 'application/json',
            },
          });

          if (response.ok) {
            const product = await response.json();
            return product;
          } else {
            console.warn(`Failed to fetch product ${productId}: ${response.status}`);
            return null;
          }
        } catch (error) {
          console.warn(`Error fetching product ${productId}:`, error);
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      products.push(...batchResults.filter(p => p !== null));
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`Successfully loaded ${products.length} products from ${productIds.length} IDs`);

    return new Response(
      JSON.stringify({
        data: products,
        list_meta: { total_count: products.length }
      }),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error in handleLoadFromSavedIds:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to load products from saved IDs',
        details: getErrorMessage(error)
      }),
      { status: 500, headers: corsHeaders }
    );
  }
}

// Admin-specific function to get gift cards from database (filtered by brand_id)
async function getGiftCardsProductsFromDB(supabaseClient: any, page: number = 1, perPage: number = 20, environment: string = 'live'): Promise<Response> {
  console.log(`Loading gift cards from database for admin catalog - page ${page}, perPage ${perPage}, environment ${environment}`);
  
  const GIFT_CARD_BRAND_ID = '84b0c3a9-b51c-4f0c-babe-117a0c6b353b';
  
  // Use environment directly without mapping
  console.log(`Loading gift cards from database for environment: ${environment}`);
  
  try {
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage - 1;

    const { data: products, error, count } = await supabaseClient
      .from('goody_gift_cards')
      .select(`
        goody_product_id,
        name,
        brand_name,
        brand_id,
        subtitle,
        description,
        image_url,
        price,
        price_is_variable,
        product_data,
        environment
      `, { count: 'exact' })
      .eq('is_active', true)
      .eq('environment', environment)
      .eq('brand_id', GIFT_CARD_BRAND_ID)
      .order('name')
      .range(startIndex, endIndex);

    if (error) {
      console.error('Database query error:', error);
      throw new Error(`Database query failed: ${error.message}`);
    }

    // Transform to match expected format
    const transformedProducts = products?.map((product: any) => {
      // Extract price and price_is_variable from product_data if available
      const productData = product.product_data || {};
      const actualPrice = productData.price || product.price || 0;
      const isVariablePrice = productData.price_is_variable || product.price_is_variable || false;
      
      return {
        id: product.goody_product_id,
        name: product.name,
        brand: { 
          name: product.brand_name,
          id: product.brand_id || '',
          shipping_price: 0
        },
        subtitle: product.subtitle,
        description: product.description,
        images: product.image_url ? [{ 
          id: '',
          image_large: { 
            url: product.image_url,
            width: 400,
            height: 400
          }
        }] : [],
        variants: [{
          id: '',
          name: product.name,
          subtitle: product.subtitle || '',
          price_cents: actualPrice,
          image_large: {
            url: product.image_url || '',
            width: 400,
            height: 400
          }
        }],
        price: actualPrice,
        price_is_variable: isVariablePrice,
        environment: product.environment
      };
    }) || [];

    console.log(`Loaded ${transformedProducts.length} gift cards from database for admin catalog page ${page}`);
    
    const responseSize = JSON.stringify(transformedProducts).length;
    console.log(`Response size: ${responseSize} characters`);

    return new Response(
      JSON.stringify({
        data: transformedProducts,
        list_meta: { 
          total_count: count || 0,
          current_page: page,
          per_page: perPage,
          environment: environment
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in getGiftCardsProductsFromDB:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to load gift cards from database',
        details: getErrorMessage(error)
      }),
      { status: 500, headers: corsHeaders }
    );
  }
}

// Generic database query function (for legacy support)
async function handleLoadFromDatabase(supabaseClient: any, page: number = 1, perPage: number = 20, environment: string = 'live', brandId?: string): Promise<Response> {
  console.log(`Loading products from database for ${environment} environment - page ${page}, perPage ${perPage}`);
  
  try {
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage - 1;

    let query = supabaseClient
      .from('goody_gift_cards')
      .select(`
        goody_product_id,
        name,
        brand_name,
        brand_id,
        subtitle,
        description,
        image_url,
        price,
        environment
      `, { count: 'exact' })
      .eq('is_active', true)
      .eq('environment', environment);

    // Apply brand filter if provided (legacy compatibility)
    if (brandId) {
      query = query.eq('brand_id', brandId);
    }

    const { data: products, error, count } = await query
      .order('name')
      .range(startIndex, endIndex);

    if (error) {
      console.error('Database query error:', error);
      throw new Error(`Database query failed: ${error.message}`);
    }

    // Transform to match expected format
    const transformedProducts = products?.map((product: any) => ({
      id: product.goody_product_id,
      name: product.name,
      brand: { 
        name: product.brand_name,
        id: product.brand_id || '',
        shipping_price: 0
      },
      subtitle: product.subtitle,
      description: product.description,
      images: product.image_url ? [{ 
        id: '',
        image_large: { 
          url: product.image_url,
          width: 400,
          height: 400
        }
      }] : [],
      variants: [{
        id: '',
        name: product.name,
        subtitle: product.subtitle || '',
        price_cents: product.price || 0,
        image_large: {
          url: product.image_url || '',
          width: 400,
          height: 400
        }
      }],
      price: product.price || 0,
      price_is_variable: product.price_is_variable || false,
      environment: product.environment
    })) || [];

    console.log(`Loaded ${transformedProducts.length} products from database for page ${page}`);
    
    const responseSize = JSON.stringify(transformedProducts).length;
    console.log(`Response size: ${responseSize} characters`);

    return new Response(
      JSON.stringify({
        data: transformedProducts,
        list_meta: { 
          total_count: count || 0,
          current_page: page,
          per_page: perPage,
          environment: environment
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in handleLoadFromDatabase:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to load products from database',
        details: getErrorMessage(error)
      }),
      { status: 500, headers: corsHeaders }
    );
  }
}

// Handle direct API loading of gift cards with brand filtering
async function handleDirectGiftCardLoad(
  baseUrl: string, 
  apiKey: string, 
  page: number, 
  perPage: number, 
  environment: string
): Promise<Response> {
  try {
    const GIFT_CARD_BRAND_ID = '84b0c3a9-b51c-4f0c-babe-117a0c6b353b';
    
    console.log(`Direct API loading gift cards for ${environment} environment - fetching ALL pages until 0 results`);
    
    let allFilteredProducts: GoodyProduct[] = [];
    let currentPage = 1;
    let totalProcessed = 0;
    let hasMorePages = true;
    const maxPages = 100; // Safety limit to prevent infinite loops (10,000 products max)
    let progressLogCounter = 0;
    
    while (hasMorePages && currentPage <= maxPages) {
      console.log(`Fetching page ${currentPage} from Goody API...`);
      
      // Fetch products without brand filtering (API brand filter is unreliable)
      const goodyResponse = await fetch(
        `${baseUrl}/v1/products?page=${currentPage}&per_page=100`, // Use max per_page for efficiency
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!goodyResponse.ok) {
        const errorText = await goodyResponse.text();
        console.error('Goody API error response:', errorText);
        
        if (goodyResponse.status === 401) {
          throw new Error(`Goody API authentication failed. Status: ${goodyResponse.status}`);
        }
        
        throw new Error(`Goody API error: ${goodyResponse.status} - ${errorText}`);
      }

      const goodyData = await goodyResponse.json();
      const pageProducts = goodyData.data || [];
      totalProcessed += pageProducts.length;
      
      console.log(`Page ${currentPage}: ${pageProducts.length} total products received`);
      
      // Check for natural termination - no more products returned
      if (pageProducts.length === 0) {
        console.log(`Reached end of available products at page ${currentPage} - API returned 0 results`);
        hasMorePages = false;
        break;
      }
      
      // Client-side filtering for the specific gift card brand ID
      const filteredPageProducts = pageProducts.filter((product: GoodyProduct) => 
        product.brand && product.brand.id === GIFT_CARD_BRAND_ID
      );
      
      console.log(`Page ${currentPage}: ${filteredPageProducts.length} gift cards found from brand ID ${GIFT_CARD_BRAND_ID}`);
      
      allFilteredProducts = allFilteredProducts.concat(filteredPageProducts);
      
      // Progress logging every 10 pages
      progressLogCounter++;
      if (progressLogCounter % 10 === 0) {
        console.log(`Progress: Processed ${currentPage} pages, ${totalProcessed} total products, found ${allFilteredProducts.length} gift cards so far`);
      }
      
      // Check if there are more pages (less than 100 means we're at the end)
      hasMorePages = pageProducts.length === 100;
      currentPage++;
      
      // Small delay to be respectful to the API
      if (currentPage % 50 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay every 50 pages
      }
    }
    
    // Log final aggregation results
    if (currentPage > maxPages) {
      console.log(`SAFETY LIMIT REACHED: Stopped at ${maxPages} pages (${totalProcessed} products). Consider increasing maxPages if needed.`);
    } else {
      console.log(`NATURAL TERMINATION: API returned 0 results at page ${currentPage}`);
    }
    
    console.log(`Aggregation complete: ${allFilteredProducts.length} total gift cards from ${currentPage - 1} pages (${totalProcessed} total products processed)`);
    
    // Apply requested pagination to the filtered results
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    const paginatedProducts = allFilteredProducts.slice(startIndex, endIndex);
    
    console.log(`Returning page ${page} with ${paginatedProducts.length} gift cards (${startIndex + 1}-${startIndex + paginatedProducts.length} of ${allFilteredProducts.length} total)`);
    
    return new Response(
      JSON.stringify({
        data: paginatedProducts,
        list_meta: {
          total_count: allFilteredProducts.length,
          current_page: page,
          per_page: perPage,
          environment: environment,
          total_pages: Math.ceil(allFilteredProducts.length / perPage)
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in handleDirectGiftCardLoad:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to load gift cards directly from API',
        details: getErrorMessage(error)
      }),
      { status: 500, headers: corsHeaders }
    );
  }
}