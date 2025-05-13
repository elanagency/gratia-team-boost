
// Follow Deno Deploy runtime compatibility
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

interface RyeProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  url: string;
}

interface RedemptionRequest {
  rewardId: string;
  userId: string;
  shippingAddress: {
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceKey
    );
    
    const reqData = await req.json();
    const action = reqData.action;

    // Create a client to honor RLS policies
    const authHeader = req.headers.get('Authorization');
    const clientSuapbase = createClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        global: {
          headers: { Authorization: authHeader || '' },
        },
      }
    );

    // Verify auth token for most operations
    const { data: { user }, error: authError } = await clientSuapbase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
        
      case 'requestShopifyProductByURL':
      case 'requestAmazonProductByURL':
        // In a real implementation, this would call the Rye GraphQL API
        // For now, we'll simulate this with mock data based on the URL
        const { url } = reqData;
        console.log(`Request to fetch product from URL: ${url}`);
        
        // Generate mock product data
        const isAmazon = url.includes('amazon') || url.includes('amzn');
        const mockProduct: RyeProduct = {
          id: `product_${Math.random().toString(36).substr(2, 9)}`,
          title: isAmazon ? 'Amazon Product' : 'Shopify Product',
          description: `This is a mock ${isAmazon ? 'Amazon' : 'Shopify'} product for ${url}`,
          price: Math.floor(Math.random() * 200) + 20, // Random price between $20 and $220
          imageUrl: isAmazon 
            ? 'https://images.unsplash.com/photo-1523275335684-37898b6baf30' 
            : 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e',
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

      case 'redeem':
        // Parse the request body
        const redemptionData: RedemptionRequest = reqData;
        const { rewardId, shippingAddress } = redemptionData;
        
        // In a real implementation, this would:
        // 1. Fetch the reward details from the database
        const { data: reward, error: rewardError } = await supabaseAdmin
          .from('rewards')
          .select('*')
          .eq('id', rewardId)
          .single();
          
        if (rewardError || !reward) {
          return new Response(
            JSON.stringify({ error: 'Reward not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // 2. Verify the user has enough points
        const { data: member, error: memberError } = await supabaseAdmin
          .from('company_members')
          .select('points')
          .eq('user_id', user.id)
          .eq('company_id', reward.company_id)
          .single();
          
        if (memberError || !member) {
          return new Response(
            JSON.stringify({ error: 'User membership not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        if (member.points < reward.points_cost) {
          return new Response(
            JSON.stringify({ error: 'Insufficient points' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // 3. Create a redemption record
        const { data: redemption, error: redemptionError } = await supabaseAdmin
          .from('reward_redemptions')
          .insert({
            user_id: user.id,
            reward_id: rewardId,
            points_spent: reward.points_cost,
            shipping_address: shippingAddress,
            status: 'pending'
          })
          .select()
          .single();
          
        if (redemptionError) {
          return new Response(
            JSON.stringify({ error: 'Failed to create redemption record' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // 4. Deduct points from user
        const { error: updateError } = await supabaseAdmin
          .from('company_members')
          .update({ points: member.points - reward.points_cost })
          .eq('user_id', user.id)
          .eq('company_id', reward.company_id);
          
        if (updateError) {
          // Rollback redemption if points update fails
          await supabaseAdmin
            .from('reward_redemptions')
            .delete()
            .eq('id', redemption.id);
            
          return new Response(
            JSON.stringify({ error: 'Failed to update points' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // 5. In a real implementation, make API calls to Rye here
        // - Create cart
        // - Add item to cart
        // - Set shipping information
        // - Submit cart
        
        // For this implementation, we'll simulate a successful redemption
        const mockCart = {
          id: `cart_${Math.random().toString(36).substring(2, 10)}`,
          items: [{ productId: reward.external_id || 'mock_product_id', quantity: 1 }]
        };
        
        const mockOrder = {
          id: `order_${Math.random().toString(36).substring(2, 10)}`,
          status: 'processing',
          tracking: {
            carrier: 'USPS',
            number: Math.random().toString().substring(2, 12)
          }
        };

        // 6. Update the redemption record with the Rye cart and order IDs
        await supabaseAdmin
          .from('reward_redemptions')
          .update({
            rye_cart_id: mockCart.id,
            rye_order_id: mockOrder.id,
            status: 'processing'
          })
          .eq('id', redemption.id);

        return new Response(
          JSON.stringify({ 
            success: true, 
            redemption: {
              id: redemption.id,
              status: 'processing',
              points_spent: reward.points_cost
            }
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
