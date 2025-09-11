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

    // Step 1: Backup user data before deletion
    console.log('Backing up user data...')
    
    // Get company name for backup
    const { data: company } = await supabase
      .from('companies')
      .select('name')
      .eq('id', companyId)
      .single()

    if (!company) {
      return new Response(
        JSON.stringify({ error: 'Company not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get all users associated with the company for backup
    const { data: usersToBackup } = await supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        points,
        department,
        role
      `)
      .eq('company_id', companyId)

    console.log('Found users to backup:', usersToBackup?.length || 0)

    if (usersToBackup && usersToBackup.length > 0) {
      // Get email addresses from auth.users
      const userIds = usersToBackup.map(u => u.id)
      const { data: authData } = await supabase.auth.admin.listUsers()
      const emailMap = authData.users.reduce((acc, authUser) => {
        acc[authUser.id] = authUser.email
        return acc
      }, {} as Record<string, string>)

      // Create backup records
      const backupRecords = usersToBackup.map(userToBackup => ({
        original_user_id: userToBackup.id,
        first_name: userToBackup.first_name,
        last_name: userToBackup.last_name,
        email: emailMap[userToBackup.id] || '',
        company_name: company.name,
        points: userToBackup.points || 0,
        department: userToBackup.department,
        role: userToBackup.role,
        deleted_by: user.id // Platform admin who performed the deletion
      }))

      // Insert backup records
      const { error: backupError } = await supabase
        .from('backup_users')
        .insert(backupRecords)

      if (backupError) {
        console.error('Failed to backup user data:', backupError)
        throw new Error('Failed to backup user data: ' + backupError.message)
      }

      console.log('User data backed up successfully')

      // Step 2: Delete auth.users records
      console.log('Deleting auth users...')
      for (const userId of userIds) {
        const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(userId)
        if (deleteAuthError) {
          console.error('Failed to delete auth user:', userId, deleteAuthError)
          // Continue with other deletions even if one fails
        }
      }
      console.log('Auth users deleted successfully')
    }

    // Step 3: Delete company-related data in correct order
    const deletions = [
      // Delete point-related records
      supabase.from('monthly_points_allocations').delete().eq('company_id', companyId),
      supabase.from('point_transactions').delete().eq('company_id', companyId),
      
      // Delete subscription events
      supabase.from('subscription_events').delete().eq('company_id', companyId),
      
      // Mark profiles as inactive instead of deleting (they're already backed up)
      supabase.from('profiles').update({ is_active: false }).eq('company_id', companyId),
      
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