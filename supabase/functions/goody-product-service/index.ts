import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

  return searchTerms.some(term => subtitle.includes(term));
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

    const goodyApiKey = Deno.env.get('GOODY_API_KEY');
    if (!goodyApiKey) {
      console.error('GOODY_API_KEY environment variable not found');
      throw new Error('GOODY_API_KEY not configured');
    }

    console.log('GOODY_API_KEY is configured:', goodyApiKey ? 'Yes' : 'No');

    // Handle GET and POST requests for fetching products
    if (req.method === 'GET' || req.method === 'POST') {
      let pageNum = 1;
      let perPage = 50;
      let isProductFetch = true;
      let fetchAll = false;
      
      if (req.method === 'GET') {
        const url = new URL(req.url);
        pageNum = parseInt(url.searchParams.get('page') || '1');
        perPage = parseInt(url.searchParams.get('per_page') || '50');
        fetchAll = url.searchParams.get('fetch_all') === 'true';
        } else if (req.method === 'POST') {
          try {
            const body = await req.json();
            
            // Handle SYNC method
            if (body.method === 'SYNC') {
              return await handleSyncGiftCards(goodyApiKey, supabase);
            }
            
            // Handle LOAD_FROM_SAVED_IDS method  
            if (body.method === 'LOAD_FROM_SAVED_IDS') {
              const { page = 1, perPage: requestPerPage = 50 } = body;
              return await handleLoadFromSavedIds(goodyApiKey, supabase, page, requestPerPage);
            }
            
            // Handle LOAD_FROM_DATABASE method  
            if (body.method === 'LOAD_FROM_DATABASE') {
              const { page = 1, perPage: requestPerPage = 50 } = body;
              return await handleLoadFromDatabase(supabase, page, requestPerPage);
            }
            
            // Check if this is a product fetch request or add products request
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

              // For now, return success since we're not storing products in DB anymore
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
        if (fetchAll) {
          console.log('Fetching all Goody products across all pages...');
          const allProducts: GoodyProduct[] = [];
          let currentPage = 1;
          let totalCount = 0;
          
          while (true) {
            console.log(`Fetching page ${currentPage}...`);
            
            const goodyResponse = await fetch(
              `https://api.ongoody.com/v1/products?page=${currentPage}&per_page=${perPage}`,
              {
                headers: {
                  'Authorization': `Bearer ${goodyApiKey}`,
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
          
          console.log(`Successfully fetched all ${allProducts.length} products from Goody across ${currentPage} pages`);

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
          console.log(`Fetching Goody catalog - page: ${pageNum}, per_page: ${perPage}`);
          console.log(`Using API key starting with: ${goodyApiKey.substring(0, 10)}...`);

          const goodyResponse = await fetch(
            `https://api.ongoody.com/v1/products?page=${pageNum}&per_page=${perPage}`,
            {
              headers: {
                'Authorization': `Bearer ${goodyApiKey}`,
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
        error: error.message || 'Internal server error',
        details: error.toString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

// New function to sync all gift cards and save their IDs
async function handleSyncGiftCards(goodyApiKey: string, supabaseClient: any) {
  console.log('Starting gift card sync process...');
  
  const allGiftCards = [];
  let page = 1;
  let hasMorePages = true;
  let totalFetched = 0;

  try {
    while (hasMorePages) {
      console.log(`Fetching page ${page}...`);
      
      const response = await fetch(`https://api.ongoody.com/v1/products?page=${page}&per_page=50`, {
        headers: {
          'Authorization': `Bearer ${goodyApiKey}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        console.error(`Failed to fetch page ${page}: ${response.status} ${response.statusText}`);
        break;
      }

      const data = await response.json() as GoodyApiResponse;
      const giftCards = data.data.filter(isGiftCard);
      
      allGiftCards.push(...giftCards);
      totalFetched += data.data.length;
      
      console.log(`Fetched ${data.data.length} products from page ${page}. Found ${giftCards.length} gift cards. Total gift cards so far: ${allGiftCards.length}`);
      
      if (data.data.length < 50) {
        hasMorePages = false;
      } else {
        page++;
      }

      // Add a small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`Sync complete. Found ${allGiftCards.length} gift cards out of ${totalFetched} total products.`);

    // Prepare gift card records for database with full product data
    const giftCardRecords = allGiftCards.map(product => ({
      goody_product_id: product.id,
      name: product.name,
      brand_name: product.brand.name,
      price: product.price,
      image_url: product.images?.[0]?.image_large?.url || product.variants?.[0]?.image_large?.url,
      description: product.recipient_description,
      subtitle: product.subtitle,
      product_data: product, // Store full product JSON
      last_synced_at: new Date().toISOString(),
      is_active: true
    }));

    // Clear existing records and insert new ones
    const { error: deleteError } = await supabaseClient
      .from('goody_gift_cards')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

    if (deleteError) {
      console.error('Error clearing existing gift card records:', deleteError);
    }

    // Insert new records in batches
    const batchSize = 100;
    let insertedCount = 0;
    
    for (let i = 0; i < giftCardRecords.length; i += batchSize) {
      const batch = giftCardRecords.slice(i, i + batchSize);
      
      const { error: insertError } = await supabaseClient
        .from('goody_gift_cards')
        .insert(batch);

      if (insertError) {
        console.error(`Error inserting batch ${i / batchSize + 1}:`, insertError);
      } else {
        insertedCount += batch.length;
        console.log(`Inserted batch ${i / batchSize + 1}: ${batch.length} records`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Gift card sync completed',
        total_found: allGiftCards.length,
        total_saved: insertedCount,
        sync_timestamp: new Date().toISOString()
      }),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error during gift card sync:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Sync failed', 
        details: error.message,
        total_found: allGiftCards.length
      }),
      { status: 500, headers: corsHeaders }
    );
  }
}

// New function to load products from saved IDs
async function handleLoadFromSavedIds(goodyApiKey: string, supabaseClient: any, page: number, perPage: number) {
  try {
    // Get saved gift card IDs with pagination
    const { data: savedGiftCards, error: fetchError, count } = await supabaseClient
      .from('goody_gift_cards')
      .select('goody_product_id', { count: 'exact' })
      .eq('is_active', true)
      .order('name')
      .range((page - 1) * perPage, page * perPage - 1);

    if (fetchError) {
      console.error('Error fetching saved gift card IDs:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch saved gift card IDs' }),
        { status: 500, headers: corsHeaders }
      );
    }

    if (!savedGiftCards || savedGiftCards.length === 0) {
      return new Response(
        JSON.stringify({
          data: [],
          list_meta: { total_count: 0 },
          message: 'No synced gift cards found. Please sync first.'
        }),
        { headers: corsHeaders }
      );
    }

    // Fetch product details for each saved ID
    const products = [];
    
    for (const savedCard of savedGiftCards) {
      try {
        const response = await fetch(`https://api.ongoody.com/v1/products/${savedCard.goody_product_id}`, {
          headers: {
            'Authorization': `Bearer ${goodyApiKey}`,
            'Accept': 'application/json',
          },
        });

        if (response.ok) {
          const product = await response.json();
          products.push(product);
        } else {
          console.error(`Failed to fetch product ${savedCard.goody_product_id}: ${response.status}`);
        }
      } catch (error) {
        console.error(`Error fetching product ${savedCard.goody_product_id}:`, error);
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    console.log(`Loaded ${products.length} products from saved IDs for page ${page}`);

    return new Response(
      JSON.stringify({
        data: products,
        list_meta: { total_count: count || 0 }
      }),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error loading from saved IDs:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to load from saved IDs' }),
      { status: 500, headers: corsHeaders }
    );
  }
}

// New function to load products directly from database
async function handleLoadFromDatabase(supabaseClient: any, page: number, perPage: number) {
  try {
    const offset = (page - 1) * perPage;
    
    // Get total count
    const { count, error: countError } = await supabaseClient
      .from('goody_gift_cards')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (countError) {
      console.error('Error counting gift cards:', countError);
      throw countError;
    }

    // Get paginated products from database
    const { data: giftCards, error: fetchError } = await supabaseClient
      .from('goody_gift_cards')
      .select('product_data')
      .eq('is_active', true)
      .range(offset, offset + perPage - 1)
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('Error fetching gift cards from database:', fetchError);
      throw fetchError;
    }

    // Extract products from stored JSON data
    const products = giftCards
      .map(card => card.product_data)
      .filter(product => product !== null);

    console.log(`Loaded ${products.length} products from database for page ${page}`);

    return new Response(
      JSON.stringify({
        data: products,
        list_meta: { total_count: count || 0 }
      }),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error in handleLoadFromDatabase:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to load products from database' }),
      { status: 500, headers: corsHeaders }
    );
  }
}