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

    // Get the authenticated user
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify user is platform admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_platform_admin')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.is_platform_admin) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { company_id, amount, operation, description } = await req.json()

    if (!company_id || !amount || !operation || !description) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Amount must be positive' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get current company balance
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('points_balance, name')
      .eq('id', company_id)
      .single()

    if (companyError || !company) {
      return new Response(
        JSON.stringify({ error: 'Company not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // For remove operation, check if there are enough points
    if (operation === 'remove' && company.points_balance < amount) {
      return new Response(
        JSON.stringify({ 
          error: 'Insufficient points balance',
          current_balance: company.points_balance,
          requested: amount
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const pointsChange = operation === 'grant' ? amount : -amount
    const transactionType = operation === 'grant' ? 'platform_grant' : 'platform_deduction'
    const newBalance = company.points_balance + pointsChange

    // Update company balance
    const { error: updateError } = await supabase
      .from('companies')
      .update({ points_balance: newBalance })
      .eq('id', company_id)

    if (updateError) {
      console.error('Error updating company balance:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update company balance' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create transaction record
    const { error: transactionError } = await supabase
      .from('company_point_transactions')
      .insert({
        company_id,
        amount: Math.abs(amount),
        description,
        transaction_type: transactionType,
        created_by: user.id,
        payment_status: 'completed'
      })

    if (transactionError) {
      console.error('Error creating transaction record:', transactionError)
      // Don't fail the request if transaction logging fails, but log it
    }

    console.log(`Platform admin ${user.id} ${operation}ed ${amount} points ${operation === 'grant' ? 'to' : 'from'} company ${company.name} (${company_id})`)

    return new Response(
      JSON.stringify({
        success: true,
        operation,
        amount,
        previous_balance: company.points_balance,
        new_balance: newBalance,
        company_name: company.name
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in platform-manage-company-points:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})