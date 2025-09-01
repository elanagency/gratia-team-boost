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
      throw new Error('GOODY_API_KEY not configured');
    }

    const url = new URL(req.url);
    const action = url.pathname.split('/').pop();

    if (req.method === 'GET' && action === 'catalog') {
      const page = url.searchParams.get('page') || '1';
      const perPage = url.searchParams.get('per_page') || '50';
      
      console.log(`Fetching Goody catalog - page: ${page}, per_page: ${perPage}`);

      const goodyResponse = await fetch(
        `https://api.sandbox.ongoody.com/v1/products?page=${page}&per_page=${perPage}`,
        {
          headers: {
            'Authorization': `Bearer ${goodyApiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!goodyResponse.ok) {
        const errorText = await goodyResponse.text();
        console.error('Goody API error:', errorText);
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

    if (req.method === 'POST' && action === 'add-products') {
      const { productIds, pointsMultiplier = 1 } = await req.json();
      
      if (!Array.isArray(productIds) || productIds.length === 0) {
        throw new Error('Product IDs are required');
      }

      console.log(`Adding ${productIds.length} products with points multiplier: ${pointsMultiplier}`);

      // Fetch product details from Goody
      const productPromises = productIds.map(async (productId: string) => {
        const response = await fetch(
          `https://api.sandbox.ongoody.com/v1/products?page=1&per_page=100`,
          {
            headers: {
              'Authorization': `Bearer ${goodyApiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch product ${productId}`);
        }

        const data: GoodyApiResponse = await response.json();
        return data.data.find(p => p.id === productId);
      });

      const products = await Promise.all(productPromises);
      const validProducts = products.filter(Boolean) as GoodyProduct[];

      // Transform and insert products as rewards
      const rewardInserts = validProducts.map(product => {
        const imageUrl = product.images[0]?.image_large?.url || '';
        const pointsCost = Math.round(product.price * pointsMultiplier);
        
        // Create description with brand and variant info
        let description = product.recipient_description || '';
        if (product.brand.name) {
          description = `${product.brand.name} - ${description}`;
        }
        if (product.variants.length > 0) {
          description += `\n\nAvailable variants: ${product.variants.map(v => v.name).join(', ')}`;
        }

        return {
          name: product.name,
          description: description.trim(),
          points_cost: pointsCost,
          image_url: imageUrl,
          external_id: product.id,
          product_url: null, // Goody handles fulfillment
          is_global: true,
          company_id: null,
          stock: 100, // Default stock for Goody products
        };
      });

      const { data: insertedRewards, error } = await supabase
        .from('rewards')
        .insert(rewardInserts)
        .select();

      if (error) {
        console.error('Database insert error:', error);
        throw new Error(`Failed to save rewards: ${error.message}`);
      }

      console.log(`Successfully added ${insertedRewards.length} rewards to catalog`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Added ${insertedRewards.length} products to global rewards catalog`,
          rewards: insertedRewards 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
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