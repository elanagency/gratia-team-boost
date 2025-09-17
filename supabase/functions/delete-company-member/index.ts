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

    const { companyId, userId } = await req.json()

    if (!companyId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Company ID and User ID are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is company admin of the target company
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin, company_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.is_admin || profile.company_id !== companyId) {
      console.error('Not a company admin or wrong company:', profileError)
      return new Response(
        JSON.stringify({ error: 'Forbidden: Company admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Deleting member from company:', { companyId, userId })

    // Get member info before deletion to handle points
    const { data: member, error: memberError } = await supabase
      .from('profiles')
      .select('points, is_admin')
      .eq('company_id', companyId)
      .eq('id', userId)
      .single()

    if (memberError) {
      console.error('Error fetching member:', memberError)
      return new Response(
        JSON.stringify({ error: 'Member not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if this is the last admin
    const { data: adminProfiles, error: adminCountError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact' })
      .eq('company_id', companyId)
      .eq('is_admin', true)
      .eq('is_active', true)

    if (adminCountError) {
      console.error('Error checking admin count:', adminCountError)
      return new Response(
        JSON.stringify({ error: 'Failed to verify admin status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (member.is_admin && (adminProfiles?.length || 0) <= 1) {
      return new Response(
        JSON.stringify({ error: 'Cannot delete the last admin of a company' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Return member's points to company if they have any
    if (member.points > 0) {
      const { error: pointsError } = await supabase
        .from('companies')
        .update({ points_balance: supabase.sql`points_balance + ${member.points}` })
        .eq('id', companyId)

      if (pointsError) {
        console.error('Error returning points:', pointsError)
        throw pointsError
      }

      // Log the point transaction
      const { error: transactionError } = await supabase
        .from('point_transactions')
        .insert({
          company_id: companyId,
          sender_profile_id: userId,
          recipient_profile_id: null, // null indicates points returned to company
          points: member.points,
          description: `Points returned to company after member removal`
        })

      if (transactionError) {
        console.error('Error logging transaction:', transactionError)
        // Don't fail the deletion for this, just log it
      }
    }

    // Mark profile as inactive instead of deleting auth user
    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({ is_active: false })
      .eq('id', userId)

    if (profileUpdateError) {
      console.error('Error marking profile as inactive:', profileUpdateError)
      throw profileUpdateError
    }

    // Delete auth.users record while preserving profile and transaction history
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId)
    
    if (authDeleteError) {
      console.error('Error deleting auth user:', authDeleteError)
      throw authDeleteError
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
        console.error('Deletion error:', error)
        throw error
      }
    }


    // Get current active member count before updating subscription
    const { data: activeMembersData, error: countError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact' })
      .eq('company_id', companyId)
      .eq('is_active', true)
      .neq('id', userId) // Exclude the user being deleted

    if (countError) {
      console.error('Error counting active members:', countError)
      // Continue with deletion even if count fails
    }

    const remainingMembers = activeMembersData?.length || 0
    console.log('Remaining active members after deletion:', remainingMembers)

    // Update Stripe subscription with new member count
    try {
      const { error: subscriptionError } = await supabase.functions.invoke('update-subscription', {
        body: {
          companyId: companyId,
          newQuantity: remainingMembers
        }
      })

      if (subscriptionError) {
        console.error('Error updating subscription:', subscriptionError)
        // Don't fail the deletion for subscription update errors
      } else {
        console.log('Successfully updated subscription quantity to:', remainingMembers)
      }
    } catch (subscriptionError) {
      console.error('Failed to call update-subscription function:', subscriptionError)
      // Don't fail the deletion for subscription update errors
    }

    console.log('Member deleted successfully:', { companyId, userId, pointsReturned: member.points })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Member removed successfully',
        pointsReturned: member.points
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error deleting member:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to remove member', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})