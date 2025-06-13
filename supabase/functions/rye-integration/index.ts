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

interface RyeErrorResponse {
  errors?: Array<{
    code: string;
    message: string;
  }>;
}

// Helper function to make GraphQL requests to Rye
async function makeRyeRequest(query: string, variables: any = {}, headers: any) {
  console.log('=== RYE API REQUEST ===');
  console.log('Query:', query);
  console.log('Variables:', JSON.stringify(variables, null, 2));
  console.log('Headers (sanitized):', {
    'Content-Type': headers['Content-Type'],
    'Authorization': headers.Authorization ? '[PRESENT]' : '[MISSING]',
    'Rye-Shopper-IP': headers['Rye-Shopper-IP'] || '[MISSING]'
  });

  try {
    const response = await fetch('https://staging.graphql.api.rye.com/v1/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': headers.Authorization,
        'Rye-Shopper-IP': headers['Rye-Shopper-IP']
      },
      body: JSON.stringify({ query, variables }),
    });

    console.log('=== RYE API RESPONSE STATUS ===');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      console.error('HTTP Error Response:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error Response Body:', errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    
    console.log('=== RYE API RESPONSE BODY ===');
    console.log('Full Response:', JSON.stringify(result, null, 2));
    
    if (result.errors && result.errors.length > 0) {
      console.error('=== RYE API GRAPHQL ERRORS ===');
      result.errors.forEach((error: any, index: number) => {
        console.error(`Error ${index + 1}:`, JSON.stringify(error, null, 2));
      });
      throw new Error(`Rye API error: ${result.errors[0].message}`);
    }
    
    console.log('=== RYE API SUCCESS ===');
    return result;
  } catch (error) {
    console.error('=== RYE API REQUEST FAILED ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    throw error;
  }
}

// Map shipping address to Rye format
function mapShippingAddress(shippingAddress: any, userEmail: string) {
  const [firstName, ...lastNameParts] = shippingAddress.name.split(' ');
  const lastName = lastNameParts.join(' ') || firstName;
  
  // Expanded country mapping with more countries and ISO codes
  const countryMapping: { [key: string]: string } = {
    'United States': 'US',
    'USA': 'US',
    'Canada': 'CA',
    'United Kingdom': 'GB',
    'UK': 'GB',
    'Portugal': 'PT',
    'Spain': 'ES',
    'France': 'FR',
    'Germany': 'DE',
    'Italy': 'IT',
    'Netherlands': 'NL',
    'Belgium': 'BE',
    'Austria': 'AT',
    'Switzerland': 'CH',
    'Sweden': 'SE',
    'Norway': 'NO',
    'Denmark': 'DK',
    'Finland': 'FI',
    'Poland': 'PL',
    'Czech Republic': 'CZ',
    'Hungary': 'HU',
    'Romania': 'RO',
    'Bulgaria': 'BG',
    'Croatia': 'HR',
    'Slovenia': 'SI',
    'Slovakia': 'SK',
    'Lithuania': 'LT',
    'Latvia': 'LV',
    'Estonia': 'EE',
    'Ireland': 'IE',
    'Luxembourg': 'LU',
    'Malta': 'MT',
    'Cyprus': 'CY',
    'Greece': 'GR',
    'Australia': 'AU',
    'New Zealand': 'NZ',
    'Japan': 'JP',
    'South Korea': 'KR',
    'Singapore': 'SG',
    'Hong Kong': 'HK',
    'Taiwan': 'TW',
    'Malaysia': 'MY',
    'Thailand': 'TH',
    'India': 'IN',
    'Brazil': 'BR',
    'Mexico': 'MX',
    'Argentina': 'AR',
    'Chile': 'CL',
    'Colombia': 'CO',
    'Peru': 'PE',
    'South Africa': 'ZA',
    'Israel': 'IL',
    'Turkey': 'TR',
    'Russia': 'RU',
    'China': 'CN'
  };
  
  // Expanded state mapping for common state names to codes
  const stateMapping: { [key: string]: string } = {
    'California': 'CA',
    'New York': 'NY',
    'Texas': 'TX',
    'Florida': 'FL',
    'Illinois': 'IL',
    'Pennsylvania': 'PA',
    'Ohio': 'OH',
    'Georgia': 'GA',
    'North Carolina': 'NC',
    'Michigan': 'MI',
    'New Jersey': 'NJ',
    'Virginia': 'VA',
    'Washington': 'WA',
    'Arizona': 'AZ',
    'Massachusetts': 'MA',
    'Tennessee': 'TN',
    'Indiana': 'IN',
    'Missouri': 'MO',
    'Maryland': 'MD',
    'Wisconsin': 'WI',
    'Colorado': 'CO',
    'Minnesota': 'MN',
    'South Carolina': 'SC',
    'Alabama': 'AL',
    'Louisiana': 'LA',
    'Kentucky': 'KY',
    'Oregon': 'OR',
    'Oklahoma': 'OK',
    'Connecticut': 'CT',
    'Utah': 'UT',
    'Iowa': 'IA',
    'Nevada': 'NV',
    'Arkansas': 'AR',
    'Mississippi': 'MS',
    'Kansas': 'KS',
    'New Mexico': 'NM',
    'Nebraska': 'NE',
    'West Virginia': 'WV',
    'Idaho': 'ID',
    'Hawaii': 'HI',
    'New Hampshire': 'NH',
    'Maine': 'ME',
    'Montana': 'MT',
    'Rhode Island': 'RI',
    'Delaware': 'DE',
    'South Dakota': 'SD',
    'North Dakota': 'ND',
    'Alaska': 'AK',
    'Vermont': 'VT',
    'Wyoming': 'WY'
  };

  // Get country code with fallback and logging
  let countryCode = countryMapping[shippingAddress.country];
  if (!countryCode) {
    console.warn(`Country '${shippingAddress.country}' not found in mapping. Using as-is.`);
    countryCode = shippingAddress.country;
  }

  // Get state/province code with fallback
  let provinceCode = stateMapping[shippingAddress.state] || shippingAddress.state;

  console.log(`Country mapping: '${shippingAddress.country}' -> '${countryCode}'`);
  console.log(`State mapping: '${shippingAddress.state}' -> '${provinceCode}'`);

  return {
    firstName,
    lastName,
    email: userEmail,
    address1: shippingAddress.address,
    city: shippingAddress.city,
    provinceCode: provinceCode,
    countryCode: countryCode,
    postalCode: shippingAddress.zipCode
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
        
      case 'requestAmazonProductByURL':
        try {
          const { url } = reqData;
          console.log(`Request to fetch Amazon product from URL: ${url}`);
          
          // Get staging RYE API headers from environment variable
          const stagingHeadersJson = Deno.env.get('Staging_RYE_API_Key_Headers');
          if (!stagingHeadersJson) {
            throw new Error('Staging RYE API headers not configured');
          }
          
          let ryeHeaders;
          try {
            ryeHeaders = JSON.parse(stagingHeadersJson);
          } catch (parseError) {
            console.error('Error parsing staging headers JSON:', parseError);
            throw new Error('Invalid staging headers configuration');
          }
          
          if (!ryeHeaders.Authorization || !ryeHeaders['Rye-Shopper-IP']) {
            throw new Error('Missing required headers in staging configuration');
          }
          
          console.log('Using staging RYE headers for API calls');
          
          // Step 1: Call the Rye GraphQL API to request the product by URL
          // This returns a productId we can use to fetch details
          const requestMutation = `
            mutation {
              requestAmazonProductByURL(input: { url: "${url}" }) {
                productId
              }
            }
          `;
          
          const requestResponse = await fetch('https://staging.graphql.api.rye.com/v1/query', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': ryeHeaders.Authorization,
              'Rye-Shopper-IP': ryeHeaders['Rye-Shopper-IP']
            },
            body: JSON.stringify({ query: requestMutation }),
          });
          
          const requestResult = await requestResponse.json();
          console.log('Rye API request response:', JSON.stringify(requestResult));
          
          // Check for errors in the response
          if (requestResult.errors && requestResult.errors.length > 0) {
            throw new Error(`Rye API error: ${requestResult.errors[0].message}`);
          }
          
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
          
          const detailResponse = await fetch('https://staging.graphql.api.rye.com/v1/query', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': ryeHeaders.Authorization,
              'Rye-Shopper-IP': ryeHeaders['Rye-Shopper-IP']
            },
            body: JSON.stringify({ query: detailQuery }),
          });
          
          const detailResult = await detailResponse.json();
          console.log('Rye API detail response:', JSON.stringify(detailResult));
          
          // Check for errors in the detail response
          if (detailResult.errors && detailResult.errors.length > 0) {
            throw new Error(`Rye API error: ${detailResult.errors[0].message}`);
          }
          
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

      case 'redeem':
        try {
          // Parse the request body
          const redemptionData: RedemptionRequest = reqData;
          const { rewardId, shippingAddress } = redemptionData;
          
          console.log('=== REDEMPTION FLOW START ===');
          console.log('Reward ID:', rewardId);
          console.log('User ID:', user.id);
          console.log('Shipping Address:', JSON.stringify(shippingAddress, null, 2));
          
          // Get RYE API headers from environment variable
          const stagingHeadersJson = Deno.env.get('Staging_RYE_API_Key_Headers');
          if (!stagingHeadersJson) {
            throw new Error('Staging RYE API headers not configured');
          }
          
          let ryeHeaders;
          try {
            ryeHeaders = JSON.parse(stagingHeadersJson);
          } catch (parseError) {
            console.error('Error parsing staging headers JSON:', parseError);
            throw new Error('Invalid staging headers configuration');
          }
          
          if (!ryeHeaders.Authorization || !ryeHeaders['Rye-Shopper-IP']) {
            throw new Error('Missing required headers in staging configuration');
          }
          
          console.log('RYE Headers validated successfully');

          // Fetch the default payment method token
          console.log('Fetching default payment method...');
          const { data: defaultPaymentMethod, error: paymentMethodError } = await supabaseAdmin
            .from('platform_payment_methods')
            .select('spreedly_token')
            .eq('is_default', true)
            .eq('status', 'active')
            .single();
            
          if (paymentMethodError || !defaultPaymentMethod) {
            console.error('Default payment method fetch error:', paymentMethodError);
            throw new Error('No default payment method found');
          }

          console.log('Default payment method found, token available');
          
          // Fetch the reward details from the database
          console.log('Fetching reward details from database...');
          const { data: reward, error: rewardError } = await supabaseAdmin
            .from('rewards')
            .select('*')
            .eq('id', rewardId)
            .single();
            
          if (rewardError || !reward) {
            console.error('Reward fetch error:', rewardError);
            throw new Error('Reward not found');
          }

          console.log('Reward details:', JSON.stringify(reward, null, 2));

          if (!reward.external_id) {
            throw new Error('Reward does not have an external product ID');
          }

          // Verify the user has enough points
          console.log('Checking user points...');
          const { data: member, error: memberError } = await supabaseAdmin
            .from('company_members')
            .select('points')
            .eq('user_id', user.id)
            .eq('company_id', reward.company_id)
            .single();
            
          if (memberError || !member) {
            console.error('Member fetch error:', memberError);
            throw new Error('User membership not found');
          }
          
          console.log('User points:', member.points, 'Required:', reward.points_cost);
          
          if (member.points < reward.points_cost) {
            throw new Error('Insufficient points');
          }

          // Create a redemption record first
          console.log('Creating redemption record...');
          const { data: redemption, error: redemptionError } = await supabaseAdmin
            .from('reward_redemptions')
            .insert({
              user_id: user.id,
              reward_id: rewardId,
              points_spent: reward.points_cost,
              shipping_address: shippingAddress,
              status: 'processing'
            })
            .select()
            .single();
            
          if (redemptionError) {
            console.error('Redemption creation error:', redemptionError);
            throw new Error('Failed to create redemption record');
          }

          console.log('Created redemption record:', redemption.id);

          try {
            // STEP 1: Create Cart WITH Product Items AND Buyer Identity
            console.log('=== STEP 1: Creating cart with product and buyer identity ===');
            const buyerIdentity = mapShippingAddress(shippingAddress, user.email);
            console.log('Buyer identity:', JSON.stringify(buyerIdentity, null, 2));
            
            const createCartMutation = `
              mutation CreateCart($input: CartCreateInput!) {
                createCart(input: $input) {
                  cart {
                    id
                    cost {
                      total {
                        value
                        currency
                      }
                    }
                  }
                  errors {
                    code
                    message
                  }
                }
              }
            `;

            // Create cart with the product AND buyer identity included from the start
            const createCartVariables = {
              input: {
                items: {
                  amazonCartItemsInput: [{
                    productId: reward.external_id,
                    quantity: 1
                  }]
                },
                buyerIdentity: buyerIdentity
              }
            };

            console.log('Cart creation variables:', JSON.stringify(createCartVariables, null, 2));

            const cartResult = await makeRyeRequest(createCartMutation, createCartVariables, ryeHeaders);
            
            if (cartResult.data.createCart.errors && cartResult.data.createCart.errors.length > 0) {
              throw new Error(`Create cart failed: ${cartResult.data.createCart.errors[0].message}`);
            }

            const cartId = cartResult.data.createCart.cart.id;
            if (!cartId) {
              console.error('No cart ID in response:', JSON.stringify(cartResult, null, 2));
              throw new Error('No cart ID returned from createCart');
            }
            
            console.log('✅ Cart created successfully with ID and buyer identity:', cartId);

            // Save cart information to the carts table
            console.log('Saving cart information to database...');
            const { error: cartSaveError } = await supabaseAdmin
              .from('carts')
              .insert({
                rye_cart_id: cartId,
                user_id: user.id,
                company_id: reward.company_id,
                reward_id: rewardId,
                product_id: reward.external_id,
                quantity: 1,
                buyer_identity: buyerIdentity,
                cart_cost: cartResult.data.createCart.cart.cost,
                status: 'created'
              });

            if (cartSaveError) {
              console.error('Cart save error:', cartSaveError);
              // Don't throw here as the cart was successfully created in Rye
            } else {
              console.log('✅ Cart information saved to database');
            }

            // STEP 2: Submit Cart with Payment Token
            console.log('=== STEP 2: Submitting cart with payment token ===');
            const submitCartMutation = `
              mutation SubmitCart($input: SubmitCartInput!) {
                submitCart(input: $input) {
                  cart {
                    id
                    stores {
                      status
                      orderId
                      errors {
                        code
                        message
                      }
                    }
                  }
                  errors {
                    code
                    message
                  }
                }
              }
            `;

            const submitCartVariables = {
              input: {
                id: cartId,
                token: defaultPaymentMethod.spreedly_token
              }
            };

            console.log('Submitting cart with token');

            const submitResult = await makeRyeRequest(submitCartMutation, submitCartVariables, ryeHeaders);

            if (submitResult.data.submitCart.errors && submitResult.data.submitCart.errors.length > 0) {
              throw new Error(`Submit cart failed: ${submitResult.data.submitCart.errors[0].message}`);
            }

            // Extract order information
            const stores = submitResult.data.submitCart.cart.stores;
            if (!stores || stores.length === 0) {
              throw new Error('No stores found in cart submission response');
            }

            const store = stores[0];
            if (store.errors && store.errors.length > 0) {
              throw new Error(`Store processing failed: ${store.errors[0].message}`);
            }

            const orderId = store.orderId;
            console.log('✅ Cart submitted successfully with payment token, order ID:', orderId);

            // Update cart status to submitted
            await supabaseAdmin
              .from('carts')
              .update({ status: 'submitted' })
              .eq('rye_cart_id', cartId);

            // Deduct points from user
            console.log('Deducting points from user...');
            const { error: updateError } = await supabaseAdmin
              .from('company_members')
              .update({ points: member.points - reward.points_cost })
              .eq('user_id', user.id)
              .eq('company_id', reward.company_id);
              
            if (updateError) {
              console.error('Failed to update points, but order was placed:', updateError);
              // Don't throw here as the order was successful
            }

            // Update the redemption record with Rye IDs and success status
            await supabaseAdmin
              .from('reward_redemptions')
              .update({
                rye_cart_id: cartId,
                rye_order_id: orderId,
                status: 'completed'
              })
              .eq('id', redemption.id);

            console.log('=== REDEMPTION COMPLETED SUCCESSFULLY ===');

            return new Response(
              JSON.stringify({ 
                success: true, 
                redemption: {
                  id: redemption.id,
                  status: 'completed',
                  points_spent: reward.points_cost,
                  rye_order_id: orderId
                }
              }),
              { 
                status: 200, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            );

          } catch (ryeError) {
            console.error('=== RYE REDEMPTION FLOW FAILED ===');
            console.error('Error details:', ryeError);
            
            // Update redemption status to failed
            await supabaseAdmin
              .from('reward_redemptions')
              .update({ status: 'failed' })
              .eq('id', redemption.id);
            
            throw ryeError;
          }

        } catch (error) {
          console.error('=== REDEMPTION ERROR ===');
          console.error('Error type:', error.constructor.name);
          console.error('Error message:', error.message);
          console.error('Error stack:', error.stack);
          return new Response(
            JSON.stringify({ error: error.message || 'Redemption failed' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

      case 'checkOrderStatus':
        try {
          const { orderId } = reqData;
          
          if (!orderId) {
            throw new Error('Order ID is required');
          }

          // Get RYE API headers
          const stagingHeadersJson = Deno.env.get('Staging_RYE_API_Key_Headers');
          if (!stagingHeadersJson) {
            throw new Error('Staging RYE API headers not configured');
          }
          
          const ryeHeaders = JSON.parse(stagingHeadersJson);
          
          const orderQuery = `
            query OrderById($id: ID!) {
              orderByID(id: $id) {
                id
                status
                tracking {
                  carrier
                  trackingNumber
                }
              }
            }
          `;

          const orderResult = await makeRyeRequest(orderQuery, { id: orderId }, ryeHeaders);

          return new Response(
            JSON.stringify({ order: orderResult.data.orderByID }),
            { 
              status: 200, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        } catch (error) {
          console.error('Order status check error:', error);
          return new Response(
            JSON.stringify({ error: error.message || 'Failed to check order status' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('=== GENERAL ERROR ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
