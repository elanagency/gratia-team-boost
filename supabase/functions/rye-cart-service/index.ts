
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, makeRyeRequest, getRyeHeaders } from "../_shared/rye-helpers.ts";

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
    phone: string;
  };
}

// Map shipping address to Rye format
function mapShippingAddress(shippingAddress: any, userEmail: string) {
  console.log('📋 Mapping shipping address:', JSON.stringify(shippingAddress, null, 2));
  
  const [firstName, ...lastNameParts] = shippingAddress.name.split(' ');
  const lastName = lastNameParts.join(' ') || firstName;
  
  // Expanded country mapping with more countries and ISO codes
  const countryMapping: { [key: string]: string } = {
    'United States': 'US',
    'USA': 'US',
    'US': 'US',
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
    console.warn(`⚠️ Country '${shippingAddress.country}' not found in mapping. Using as-is.`);
    countryCode = shippingAddress.country;
  }

  // Get state/province code with fallback
  let provinceCode = stateMapping[shippingAddress.state] || shippingAddress.state;

  console.log(`🗺️ Country mapping: '${shippingAddress.country}' -> '${countryCode}'`);
  console.log(`🗺️ State mapping: '${shippingAddress.state}' -> '${provinceCode}'`);

  const buyerIdentity = {
    firstName,
    lastName,
    email: userEmail,
    phone: shippingAddress.phone,
    address1: shippingAddress.address,
    city: shippingAddress.city,
    provinceCode: provinceCode,
    countryCode: countryCode,
    postalCode: shippingAddress.zipCode
  };

  console.log('✅ Final buyer identity:', JSON.stringify(buyerIdentity, null, 2));
  return buyerIdentity;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🚀 Cart service called with method:', req.method);
    
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
      case 'redeem':
        try {
          // Parse the request body
          const redemptionData: RedemptionRequest = reqData;
          const { rewardId, shippingAddress } = redemptionData;
          
          console.log('=== REDEMPTION FLOW START ===');
          console.log('📦 Reward ID:', rewardId);
          console.log('👤 User ID:', user.id);
          console.log('📍 Shipping Address:', JSON.stringify(shippingAddress, null, 2));
          
          // Validate required fields
          if (!shippingAddress.phone) {
            console.error('❌ Phone number is missing from shipping address');
            throw new Error('Phone number is required for shipping');
          }
          
          const ryeHeaders = getRyeHeaders();
          console.log('✅ RYE Headers validated successfully');

          // Fetch the default payment method token
          console.log('💳 Fetching default payment method...');
          const { data: defaultPaymentMethod, error: paymentMethodError } = await supabaseAdmin
            .from('platform_payment_methods')
            .select('spreedly_token')
            .eq('is_default', true)
            .eq('status', 'active')
            .single();
            
          if (paymentMethodError || !defaultPaymentMethod) {
            console.error('❌ Default payment method fetch error:', paymentMethodError);
            throw new Error('No default payment method found');
          }

          console.log('✅ Default payment method found, token available');
          
          // Fetch the reward details from the database
          console.log('🎁 Fetching reward details from database...');
          const { data: reward, error: rewardError } = await supabaseAdmin
            .from('rewards')
            .select('*')
            .eq('id', rewardId)
            .single();
            
          if (rewardError || !reward) {
            console.error('❌ Reward fetch error:', rewardError);
            throw new Error('Reward not found');
          }

          console.log('✅ Reward details:', JSON.stringify(reward, null, 2));

          if (!reward.external_id) {
            console.error('❌ Reward missing external_id');
            throw new Error('Reward does not have an external product ID');
          }

          // Verify the user has enough points
          console.log('💰 Checking user points...');
          const { data: member, error: memberError } = await supabaseAdmin
            .from('company_members')
            .select('points')
            .eq('user_id', user.id)
            .eq('company_id', reward.company_id)
            .single();
            
          if (memberError || !member) {
            console.error('❌ Member fetch error:', memberError);
            throw new Error('User membership not found');
          }
          
          console.log(`💰 User points: ${member.points}, Required: ${reward.points_cost}`);
          
          if (member.points < reward.points_cost) {
            console.error('❌ Insufficient points');
            throw new Error('Insufficient points');
          }

          // Create a redemption record first
          console.log('📝 Creating redemption record...');
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
            console.error('❌ Redemption creation error:', redemptionError);
            throw new Error('Failed to create redemption record');
          }

          console.log('✅ Created redemption record:', redemption.id);

          try {
            // STEP 1: Create Cart WITH Product Items AND Buyer Identity
            console.log('=== STEP 1: Creating cart with product and buyer identity ===');
            const buyerIdentity = mapShippingAddress(shippingAddress, user.email);
            
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

            console.log('🛒 Cart creation variables:', JSON.stringify(createCartVariables, null, 2));

            const cartResult = await makeRyeRequest(createCartMutation, createCartVariables, ryeHeaders);
            
            if (cartResult.data.createCart.errors && cartResult.data.createCart.errors.length > 0) {
              throw new Error(`Create cart failed: ${cartResult.data.createCart.errors[0].message}`);
            }

            const cartId = cartResult.data.createCart.cart.id;
            if (!cartId) {
              console.error('❌ No cart ID in response:', JSON.stringify(cartResult, null, 2));
              throw new Error('No cart ID returned from createCart');
            }
            
            console.log('✅ Cart created successfully with ID and buyer identity:', cartId);

            // Save cart information to the carts table
            console.log('💾 Saving cart information to database...');
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
              console.error('❌ Cart save error:', cartSaveError);
              // Don't throw here as the cart was successfully created in Rye
            } else {
              console.log('✅ Cart information saved to database');
            }

            // STEP 2: Submit Cart with Payment Token
            console.log('=== STEP 2: Submitting cart with payment token ===');
            const submitCartMutation = `
              mutation SubmitCart($input: CartSubmitInput!) {
                submitCart(input: $input) {
                  cart {
                    id
                    stores {
                      id
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

            console.log('💳 Submitting cart with token');

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
            console.log('💰 Deducting points from user...');
            const { error: updateError } = await supabaseAdmin
              .from('company_members')
              .update({ points: member.points - reward.points_cost })
              .eq('user_id', user.id)
              .eq('company_id', reward.company_id);
              
            if (updateError) {
              console.error('❌ Failed to update points, but order was placed:', updateError);
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
            console.error('❌ Error details:', ryeError);
            
            // Update redemption status to failed
            await supabaseAdmin
              .from('reward_redemptions')
              .update({ status: 'failed' })
              .eq('id', redemption.id);
            
            throw ryeError;
          }

        } catch (error) {
          console.error('=== REDEMPTION ERROR ===');
          console.error('❌ Error type:', error.constructor.name);
          console.error('❌ Error message:', error.message);
          console.error('❌ Error stack:', error.stack);
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

          const ryeHeaders = getRyeHeaders();
          
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
        console.error('❌ Invalid action:', action);
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('=== CART SERVICE ERROR ===');
    console.error('❌ Error type:', error.constructor.name);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
