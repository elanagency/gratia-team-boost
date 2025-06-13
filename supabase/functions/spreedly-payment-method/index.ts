
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PaymentMethodRequest {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  nameOnCard: string;
  isDefault?: boolean;
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

    if (req.method === 'POST') {
      const { cardNumber, expiryMonth, expiryYear, cvv, nameOnCard, isDefault }: PaymentMethodRequest = await req.json()

      // Split the name for Spreedly API
      const nameParts = nameOnCard.trim().split(' ')
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''

      // Call Spreedly API to tokenize the payment method
      const spreedlyResponse = await fetch('https://core.spreedly.com/v1/payment_methods.json', {
        method: 'POST',
        headers: {
          'Authorization': 'Basic NUtGMkVKTk5DVDlKM0FXSjU3OFpTQUJXRFo6UkFHTmtSWWV2MFRqS080YndiYlJkeGk4aVEyem9IeTFPTUl3dzBYYjc0T0JtUXdVcHl4ZHF4R0xwN1VuMGlnZQ==',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          payment_method: {
            credit_card: {
              first_name: firstName,
              last_name: lastName,
              number: cardNumber.replace(/\s/g, ''), // Remove spaces
              verification_value: cvv,
              month: expiryMonth,
              year: expiryYear
            },
            retained: true
          }
        })
      })

      const spreedlyData = await spreedlyResponse.json()
      
      if (!spreedlyResponse.ok) {
        console.error('Spreedly API error:', spreedlyData)
        return new Response(
          JSON.stringify({ error: 'Failed to tokenize payment method', details: spreedlyData }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const paymentMethod = spreedlyData.transaction.payment_method
      const paymentToken = paymentMethod.token

      // Check if this is the first payment method to set as default
      const { count } = await supabase
        .from('platform_payment_methods')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')

      const shouldBeDefault = isDefault || count === 0

      // Store the payment method in our database
      const { data: savedPaymentMethod, error: dbError } = await supabase
        .from('platform_payment_methods')
        .insert({
          spreedly_token: paymentToken,
          card_last_four: paymentMethod.last_four_digits,
          card_type: paymentMethod.card_type,
          expiry_month: expiryMonth,
          expiry_year: expiryYear,
          cardholder_name: nameOnCard,
          status: 'active',
          is_default: shouldBeDefault
        })
        .select()
        .single()

      if (dbError) {
        console.error('Database error:', dbError)
        return new Response(
          JSON.stringify({ error: 'Failed to save payment method' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          paymentMethod: savedPaymentMethod,
          message: 'Payment method added successfully' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method === 'GET') {
      // Get all payment methods
      const { data: paymentMethods, error } = await supabase
        .from('platform_payment_methods')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Database error:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to fetch payment methods' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ paymentMethods }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method === 'PATCH') {
      const { id, isDefault } = await req.json()

      if (!id) {
        return new Response(
          JSON.stringify({ error: 'Payment method ID required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // If setting as default, first unset all other defaults
      if (isDefault) {
        await supabase
          .from('platform_payment_methods')
          .update({ is_default: false })
          .eq('status', 'active')
          .neq('id', id)
      }

      // Update the payment method's default status
      const { error } = await supabase
        .from('platform_payment_methods')
        .update({ is_default: isDefault, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) {
        console.error('Database error:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to update payment method' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Payment method updated successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

      console.log('Attempting to delete payment method:', paymentMethodId)

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

      // Delete from Spreedly first
      try {
        const spreedlyDeleteResponse = await fetch(`https://core.spreedly.com/v1/payment_methods/${paymentMethod.spreedly_token}.json`, {
          method: 'DELETE',
          headers: {
            'Authorization': 'Basic NUtGMkVKTk5DVDlKM0FXSjU3OFpTQUJXRFo6UkFHTmtSWWV2MFRqS080YndiYlJkeGk4aVEyem9IeTFPTUl3dzBYYjc0T0JtUXdVcHl4ZHF4R0xwN1VuMGlnZQ==',
            'Content-Type': 'application/json'
          }
        })

        console.log('Spreedly delete response status:', spreedlyDeleteResponse.status)

        if (!spreedlyDeleteResponse.ok) {
          const spreedlyError = await spreedlyDeleteResponse.text()
          console.error('Spreedly delete error:', spreedlyError)
          // Continue with database deletion even if Spreedly fails
        } else {
          console.log('Successfully deleted from Spreedly')
        }
      } catch (spreedlyError) {
        console.error('Error calling Spreedly delete:', spreedlyError)
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
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
