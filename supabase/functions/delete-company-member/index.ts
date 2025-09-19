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
    
    console.log('[DELETE-MEMBER] Starting deletion process')
    
    // Verify the user is authenticated
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      console.error('[DELETE-MEMBER] Authentication error:', authError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const requestBody = await req.json()
    console.log('[DELETE-MEMBER] Request body:', requestBody)
    
    const { companyId, userId } = requestBody

    if (!companyId || !userId) {
      console.error('[DELETE-MEMBER] Missing required fields:', { companyId, userId })
      return new Response(
        JSON.stringify({ error: 'Company ID and User ID are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is company admin of the target company OR platform admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin, company_id, is_platform_admin')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('[DELETE-MEMBER] Error fetching user profile:', profileError)
      return new Response(
        JSON.stringify({ error: 'Failed to verify user permissions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const isCompanyAdmin = profile?.is_admin && profile.company_id === companyId
    const isPlatformAdmin = profile?.is_platform_admin
    
    if (!isCompanyAdmin && !isPlatformAdmin) {
      console.error('[DELETE-MEMBER] Access denied:', { 
        userId: user.id, 
        isCompanyAdmin, 
        isPlatformAdmin, 
        userCompanyId: profile?.company_id, 
        targetCompanyId: companyId 
      })
      return new Response(
        JSON.stringify({ error: 'Forbidden: Company admin or platform admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('[DELETE-MEMBER] Authorized deletion:', { companyId, userId, requestedBy: user.id })

    // Get member info before deletion to handle points
    const { data: member, error: memberError } = await supabase
      .from('profiles')
      .select('points, is_admin, first_name, last_name')
      .eq('company_id', companyId)
      .eq('id', userId)
      .single()

    if (memberError) {
      console.error('[DELETE-MEMBER] Error fetching member:', memberError)
      return new Response(
        JSON.stringify({ error: 'Member not found in the specified company' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('[DELETE-MEMBER] Found member to delete:', { 
      userId, 
      name: `${member.first_name} ${member.last_name}`,
      points: member.points,
      isAdmin: member.is_admin 
    })

    // Check if this is the last admin
    const { data: adminProfiles, error: adminCountError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact' })
      .eq('company_id', companyId)
      .eq('is_admin', true)
      .eq('status', 'active')

    if (adminCountError) {
      console.error('[DELETE-MEMBER] Error checking admin count:', adminCountError)
      return new Response(
        JSON.stringify({ error: 'Failed to verify admin status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const adminCount = adminProfiles?.length || 0
    console.log('[DELETE-MEMBER] Current admin count:', adminCount)

    if (member.is_admin && adminCount <= 1) {
      console.error('[DELETE-MEMBER] Cannot delete last admin')
      return new Response(
        JSON.stringify({ error: 'Cannot delete the last admin of a company' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Points remain with the inactive profile to preserve transaction history
    console.log('[DELETE-MEMBER] Member points will remain with inactive profile:', member.points)

    // Mark profile as inactive instead of deleting auth user
    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({ status: 'deactivated' })
      .eq('id', userId)

    if (profileUpdateError) {
      console.error('[DELETE-MEMBER] Error marking profile as inactive:', profileUpdateError)
      return new Response(
        JSON.stringify({ error: 'Failed to deactivate member profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('[DELETE-MEMBER] Profile marked as deactivated')

    // Revoke all sessions for the user to immediately log them out
    try {
      await supabase.auth.admin.signOut(userId, 'global')
      console.log('[DELETE-MEMBER] User sessions revoked')
    } catch (signOutError) {
      console.error('[DELETE-MEMBER] Error revoking user sessions (non-critical):', signOutError)
      // Continue with the process even if sign out fails
    }

    // Delete user-related records in correct order (but keep profile and transactions)
    const deletions = [
      // Delete allocation records
      supabase.from('monthly_points_allocations').delete().eq('company_id', companyId).eq('user_id', userId),
      
      // Don't delete point transactions - they reference profile_id which we keep for history
    ]

    // Execute all deletions
    for (const deletion of deletions) {
      const { error } = await deletion
      if (error) {
        console.error('[DELETE-MEMBER] Deletion error:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to clean up related records' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    console.log('[DELETE-MEMBER] Related records cleaned up')

    // Get current active non-admin member count before updating subscription (billable seats only)
    const { data: activeMembersData, error: countError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact' })
      .eq('company_id', companyId)
      .eq('status', 'active')
      .eq('is_admin', false) // Only count non-admin members for billing
      .neq('id', userId) // Exclude the user being deleted

    if (countError) {
      console.error('[DELETE-MEMBER] Error counting active members:', countError)
      // Continue with deletion even if count fails
    }

    const remainingMembers = activeMembersData?.length || 0
    console.log('[DELETE-MEMBER] Remaining active members after deletion:', remainingMembers)

    // Update Stripe subscription with new member count
    try {
      const { error: subscriptionError } = await supabase.functions.invoke('update-subscription', {
        body: {
          companyId: companyId,
          newQuantity: remainingMembers
        }
      })

      if (subscriptionError) {
        console.error('[DELETE-MEMBER] Error updating subscription:', subscriptionError)
        // Don't fail the deletion for subscription update errors
      } else {
        console.log('[DELETE-MEMBER] Successfully updated subscription quantity to:', remainingMembers)
      }
    } catch (subscriptionError) {
      console.error('[DELETE-MEMBER] Failed to call update-subscription function:', subscriptionError)
      // Don't fail the deletion for subscription update errors
    }

    console.log('[DELETE-MEMBER] Member deactivated successfully:', { 
      companyId, 
      userId, 
      memberName: `${member.first_name} ${member.last_name}`,
      pointsRetained: member.points 
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Member removed successfully',
        memberName: `${member.first_name} ${member.last_name}`,
        pointsRetained: member.points
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[DELETE-MEMBER] Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to remove member', 
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})