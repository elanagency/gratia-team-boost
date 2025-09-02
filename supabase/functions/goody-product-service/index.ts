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
          
          // Check if this is a product fetch request or add products request
          if (body.method === 'GET' || (!body.productIds && !body.pointsMultiplier)) {
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
            allProducts.push(...pageData.data);
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
          console.log(`Successfully fetched ${goodyData.data.length} products from Goody`);

          return new Response(
            JSON.stringify(goodyData),
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