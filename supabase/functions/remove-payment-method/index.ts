
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    )

    // Get the authorization header and extract user
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify user is platform admin
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is platform admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_platform_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_platform_admin) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Platform admin required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method === 'DELETE') {
      const body = await req.json()
      const paymentMethodId = body.id

      if (!paymentMethodId) {
        return new Response(
          JSON.stringify({ error: 'Payment method ID required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('=== STARTING PAYMENT METHOD REMOVAL ===')
      console.log('Payment Method ID:', paymentMethodId)

      // First, get the payment method to retrieve the Spreedly token
      const { data: paymentMethod, error: fetchError } = await supabase
        .from('platform_payment_methods')
        .select('spreedly_token')
        .eq('id', paymentMethodId)
        .eq('status', 'active')
        .single()

      if (fetchError || !paymentMethod) {
        console.error('Payment method not found:', fetchError)
        return new Response(
          JSON.stringify({ error: 'Payment method not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('Found payment method with token:', paymentMethod.spreedly_token)

      // Redact from Spreedly using the correct endpoint
      try {
        console.log('Calling Spreedly redact endpoint...')
        const spreedlyRedactResponse = await fetch(`https://core.spreedly.com/v1/payment_methods/${paymentMethod.spreedly_token}/redact.json`, {
          method: 'POST',
          headers: {
            'Authorization': 'Basic NUtGMkVKTk5DVDlKM0FXSjU3OFpTQUJXRFo6UkFHTmtSWWV2MFRqS080YndiYlJkeGk4aVEyem9IeTFPTUl3dzBYYjc0T0JtUXdVcHl4ZHF4R0xwN1VuMGlnZQ==',
            'Content-Type': 'application/json'
          }
        })

        console.log('Spreedly redact response status:', spreedlyRedactResponse.status)

        if (!spreedlyRedactResponse.ok) {
          const spreedlyError = await spreedlyRedactResponse.text()
          console.error('Spreedly redact error:', spreedlyError)
          // Continue with database deletion even if Spreedly fails
        } else {
          const spreedlyResult = await spreedlyRedactResponse.json()
          console.log('Successfully redacted from Spreedly:', spreedlyResult)
        }
      } catch (spreedlyError) {
        console.error('Error calling Spreedly redact:', spreedlyError)
        // Continue with database deletion even if Spreedly fails
      }

      // Soft delete from database (update status to 'deleted')
      const { error: deleteError } = await supabase
        .from('platform_payment_methods')
        .update({ status: 'deleted', updated_at: new Date().toISOString() })
        .eq('id', paymentMethodId)

      if (deleteError) {
        console.error('Database delete error:', deleteError)
        return new Response(
          JSON.stringify({ error: 'Failed to delete payment method from database' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('Successfully deleted payment method from database')

      return new Response(
        JSON.stringify({ success: true, message: 'Payment method removed successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error removing payment method:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
