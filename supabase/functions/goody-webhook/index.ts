import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== Goody Webhook Received ===');
    
    // Create admin Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Parse webhook payload
    const payload = await req.json();
    console.log('Webhook event type:', payload.type);
    console.log('Full payload:', JSON.stringify(payload, null, 2));

    const eventType = payload.type;
    const data = payload.data;

    // Handle order_batch.completed event
    if (eventType === 'order_batch.completed') {
      const orderBatchId = data.id;
      const orders = data.orders || data.orders_preview || [];
      
      console.log('Order batch completed:', orderBatchId);
      console.log('Number of orders:', orders.length);

      if (orders.length === 0) {
        console.warn('No orders found in order_batch.completed event');
        return new Response(JSON.stringify({ 
          received: true, 
          message: 'No orders to process' 
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Process each order in the batch
      for (const order of orders) {
        const giftLink = order.individual_gift_link || order.gift_link || order.link;
        const orderId = order.id;

        console.log('Processing order:', orderId);
        console.log('Gift link available:', !!giftLink);

        // Find redemption by order batch ID
        const { data: redemption, error: findError } = await supabase
          .from('redemptions')
          .select('*')
          .eq('goody_order_batch_id', orderBatchId)
          .maybeSingle();

        if (findError) {
          console.error('Error finding redemption:', findError);
          continue;
        }

        if (!redemption) {
          console.warn('No redemption found for order batch:', orderBatchId);
          console.log('This might be normal if webhook arrived before redemption was saved');
          continue;
        }

        // Only update if still pending
        if (redemption.status !== 'pending' && redemption.status !== 'created') {
          console.log('Redemption already processed:', redemption.id, 'Status:', redemption.status);
          continue;
        }

        // Update redemption with completed status and gift link
        const { error: updateError } = await supabase
          .from('redemptions')
          .update({
            status: 'completed',
            individual_gift_link: giftLink,
            goody_order_id: orderId,
            updated_at: new Date().toISOString()
          })
          .eq('id', redemption.id);

        if (updateError) {
          console.error('Failed to update redemption:', redemption.id, updateError);
        } else {
          console.log('Successfully updated redemption:', redemption.id);
        }
      }

      return new Response(JSON.stringify({ 
        received: true,
        processed: orders.length 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Handle order_batch.failed event
    if (eventType === 'order_batch.failed') {
      const orderBatchId = data.id;
      const failureReason = data.failure_reason || 'Unknown error';
      
      console.log('Order batch failed:', orderBatchId);
      console.log('Failure reason:', failureReason);

      // Find redemption
      const { data: redemption, error: findError } = await supabase
        .from('redemptions')
        .select('*, user_id, points_spent')
        .eq('goody_order_batch_id', orderBatchId)
        .maybeSingle();

      if (findError || !redemption) {
        console.error('Error finding failed redemption:', findError);
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Update redemption status to failed
      const { error: updateError } = await supabase
        .from('redemptions')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', redemption.id);

      if (updateError) {
        console.error('Failed to update redemption status:', updateError);
      }

      // Refund points to user
      const { error: refundError } = await supabase.rpc('transfer_points_between_users', {
        sender_user_id: redemption.user_id,
        recipient_user_id: redemption.user_id,
        transfer_company_id: redemption.company_id,
        points_amount: 0, // We'll do a direct update instead
        transfer_description: `Refund for failed redemption: ${redemption.reward_name}`
      });

      // Direct point refund
      const { data: profile } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', redemption.user_id)
        .single();

      if (profile) {
        await supabase
          .from('profiles')
          .update({ points: profile.points + redemption.points_spent })
          .eq('id', redemption.user_id);
        
        console.log('Refunded', redemption.points_spent, 'points to user:', redemption.user_id);
      }

      return new Response(JSON.stringify({ 
        received: true,
        refunded: true 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Handle other event types
    console.log('Unhandled event type:', eventType);
    
    return new Response(JSON.stringify({ 
      received: true,
      message: `Event type ${eventType} logged but not processed`
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error processing webhook:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Webhook processing failed',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
