
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, makeRyeRequest, getRyeHeaders } from "../_shared/rye-helpers.ts";

interface RyeProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  url: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🚀 Product service called with method:', req.method);
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceKey
    );
    
    const reqData = await req.json();
    console.log('📥 Request data:', JSON.stringify(reqData, null, 2));
    const action = reqData.action;

    // Create a client to honor RLS policies
    const authHeader = req.headers.get('Authorization');
    const clientSupabase = createClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        global: {
          headers: { Authorization: authHeader || '' },
        },
      }
    );

    // Verify auth token for most operations
    const { data: { user }, error: authError } = await clientSupabase.auth.getUser();
    if (authError || !user) {
      console.error('❌ Authentication failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ User authenticated:', user.id);

    // Handle different actions
    switch (action) {
      case 'discover-products':
        // In a real implementation, this would call the Rye API to fetch products
        // Here we'll just return some mock data
        return new Response(
          JSON.stringify({
            products: [
              {
                id: 'p1',
                title: 'Wireless Earbuds',
                description: 'High-quality wireless earbuds with noise cancellation',
                price: 129.99,
                imageUrl: 'https://images.unsplash.com/photo-1608228088998-57828365d486',
                url: 'https://shop.example.com/products/wireless-earbuds',
              },
              {
                id: 'p2',
                title: 'Smart Watch',
                description: 'Fitness and health tracking smart watch',
                price: 199.99,
                imageUrl: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a',
                url: 'https://shop.example.com/products/smart-watch',
              },
              {
                id: 'p3',
                title: 'Portable Bluetooth Speaker',
                description: 'Waterproof portable Bluetooth speaker with 20-hour battery life',
                price: 89.99,
                imageUrl: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1',
                url: 'https://shop.example.com/products/portable-speaker',
              },
            ]
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
        
      case 'requestAmazonProductByURL':
        try {
          const { url } = reqData;
          console.log(`Request to fetch Amazon product from URL: ${url}`);
          
          const ryeHeaders = getRyeHeaders();
          console.log('Using staging RYE headers for API calls');
          
          // Step 1: Call the Rye GraphQL API to request the product by URL
          const requestMutation = `
            mutation {
              requestAmazonProductByURL(input: { url: "${url}" }) {
                productId
              }
            }
          `;
          
          const requestResult = await makeRyeRequest(requestMutation, {}, ryeHeaders);
          
          if (!requestResult.data || !requestResult.data.requestAmazonProductByURL || !requestResult.data.requestAmazonProductByURL.productId) {
            throw new Error('Invalid product request data received from Rye API');
          }
          
          // Extract the product ID from the first request
          const productId = requestResult.data.requestAmazonProductByURL.productId;
          
          // Step 2: Fetch detailed product information using the product ID
          const detailQuery = `
            query {
              productByID(input: { id: "${productId}", marketplace: AMAZON }) {
                id
                title
                description
                images { url }
                price { value currency }
                url
              }
            }
          `;
          
          const detailResult = await makeRyeRequest(detailQuery, {}, ryeHeaders);
          
          if (!detailResult.data || !detailResult.data.productByID) {
            throw new Error('Invalid product detail data received from Rye API');
          }
          
          // Transform the Rye product format to our application format
          const ryeProduct = detailResult.data.productByID;
          
          const product: RyeProduct = {
            id: ryeProduct.id,
            title: ryeProduct.title,
            description: ryeProduct.description || '',
            price: ryeProduct.price.value || 0,
            imageUrl: ryeProduct.images && ryeProduct.images.length > 0 ? ryeProduct.images[0].url : '',
            url: ryeProduct.url
          };
          
          return new Response(
            JSON.stringify({ product }),
            { 
              status: 200, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        } catch (error) {
          console.error('Error fetching Amazon product:', error);
          return new Response(
            JSON.stringify({ error: error.message || 'Failed to fetch Amazon product' }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
        
      case 'requestShopifyProductByURL':
        // In a real implementation, this would call the Rye GraphQL API
        // For now, we'll simulate this with mock data based on the URL
        const { url } = reqData;
        console.log(`Request to fetch Shopify product from URL: ${url}`);
        
        // Generate mock product data
        const mockProduct: RyeProduct = {
          id: `product_${Math.random().toString(36).substr(2, 9)}`,
          title: 'Shopify Product',
          description: `This is a mock Shopify product for ${url}`,
          price: Math.floor(Math.random() * 200) + 20, // Random price between $20 and $220
          imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e',
          url: url
        };
        
        return new Response(
          JSON.stringify({ product: mockProduct }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
        
      case 'productById':
        // In a real implementation, this would call the Rye GraphQL API to get product details
        const { productId } = reqData;
        
        // Generate mock product details
        const mockProductDetails: RyeProduct = {
          id: productId,
          title: `Product ${productId.substring(0, 6)}`,
          description: 'This is a detailed product description with specifications and features.',
          price: Math.floor(Math.random() * 200) + 20,
          imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff',
          url: `https://example.com/product/${productId}`
        };
        
        return new Response(
          JSON.stringify({ product: mockProductDetails }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );

      default:
        console.error('❌ Invalid action:', action);
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('=== PRODUCT SERVICE ERROR ===');
    console.error('❌ Error type:', error.constructor.name);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
