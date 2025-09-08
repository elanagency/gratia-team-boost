import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from "../_shared/cors.ts"

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Verify the user is a platform admin
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      console.error('Authentication error:', authError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is platform admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_platform_admin')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.is_platform_admin) {
      console.error('Not a platform admin:', profileError)
      return new Response(
        JSON.stringify({ error: 'Forbidden: Platform admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { companyId } = await req.json()

    if (!companyId) {
      return new Response(
        JSON.stringify({ error: 'Company ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Deleting company:', companyId)

    // Delete in correct order to handle foreign key constraints
    
    // First, get reward IDs that belong to this company
    const { data: companyRewards } = await supabase
      .from('rewards')
      .select('id')
      .eq('company_id', companyId);
    
    const rewardIds = companyRewards?.map(r => r.id) || [];
    
    const deletions = [
      // Delete cart items first
      supabase.from('carts').delete().eq('company_id', companyId),
      
      // Delete point-related records
      supabase.from('member_monthly_spending').delete().eq('company_id', companyId),
      supabase.from('monthly_points_allocations').delete().eq('company_id', companyId),
      supabase.from('point_transactions').delete().eq('company_id', companyId),
      supabase.from('company_point_transactions').delete().eq('company_id', companyId),
      
      // Delete reward-related records (only if there are rewards)
      ...(rewardIds.length > 0 ? [
        supabase.from('reward_category_mappings').delete().in('reward_id', rewardIds)
      ] : []),
      supabase.from('reward_categories').delete().eq('company_id', companyId),
      supabase.from('rewards').delete().eq('company_id', companyId),
      
      // Delete subscription events
      supabase.from('subscription_events').delete().eq('company_id', companyId),
      
      // Delete company members
      supabase.from('company_members').delete().eq('company_id', companyId),
      
      // Finally delete the company
      supabase.from('companies').delete().eq('id', companyId)
    ]

    // Execute all deletions
    for (const deletion of deletions) {
      const { error } = await deletion
      if (error) {
        console.error('Deletion error:', error)
        throw error
      }
    }

    console.log('Company deleted successfully:', companyId)

    return new Response(
      JSON.stringify({ success: true, message: 'Company deleted successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error deleting company:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to delete company', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})