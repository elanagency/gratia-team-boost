import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Get user from authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('No authorization header provided')
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      console.error('Authentication failed:', authError)
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
      console.error('Platform admin verification failed:', profileError)
      return new Response(
        JSON.stringify({ error: 'Forbidden: Platform admin access required' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    const { member_id, company_id, amount, operation, description } = await req.json()

    // Validate input
    if (!member_id || !company_id || !amount || !operation || !description) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: member_id, company_id, amount, operation, description' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Amount must be a positive number' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!['grant', 'remove'].includes(operation)) {
      return new Response(
        JSON.stringify({ error: 'Operation must be either "grant" or "remove"' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get current member points from profiles table
    const { data: memberData, error: memberError } = await supabase
      .from('profiles')
      .select('points, id')
      .eq('id', member_id)
      .eq('company_id', company_id)
      .single()

    if (memberError || !memberData) {
      console.error('Member not found:', memberError)
      return new Response(
        JSON.stringify({ error: 'Member not found in this company' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const currentPoints = memberData.points || 0
    const pointsChange = operation === 'grant' ? amount : -amount
    const newPoints = currentPoints + pointsChange

    // Check if removing points would result in negative balance
    if (operation === 'remove' && newPoints < 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Insufficient points',
          current_points: currentPoints,
          requested_removal: amount
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Update member points in profiles table
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        points: newPoints,
        updated_at: new Date().toISOString()
      })
      .eq('id', member_id)
      .eq('company_id', company_id)

    if (updateError) {
      console.error('Failed to update member points:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update member points' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create transaction record for audit trail
    const { error: transactionError } = await supabase
      .from('point_transactions')
      .insert({
        company_id: company_id,
        sender_id: user.id, // Platform admin who made the change
        recipient_id: member_id,
        points: Math.abs(amount), // Always positive for transaction record
        description: `Platform admin ${operation === 'grant' ? 'granted' : 'removed'} ${amount} points: ${description}`
      })

    if (transactionError) {
      console.error('Failed to create transaction record:', transactionError)
      // Don't fail the request if transaction logging fails, but log the error
    }

    console.log(`Successfully ${operation === 'grant' ? 'granted' : 'removed'} ${amount} points to member ${member_id}`)

    return new Response(
      JSON.stringify({
        success: true,
        member_id,
        previous_points: currentPoints,
        points_change: pointsChange,
        new_points: newPoints,
        operation,
        description
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error in platform-manage-member-points:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})