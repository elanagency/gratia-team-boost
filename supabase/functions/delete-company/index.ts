import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from "../_shared/cors.ts"

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
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

    // Get company info
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

    // Get all users for backup and later auth deletion
    const { data: usersToBackup } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, points, department, role')
      .eq('company_id', companyId)

    const userIds = usersToBackup?.map(u => u.id) || []
    console.log('Found users:', userIds.length)

    // Backup user data
    if (usersToBackup && usersToBackup.length > 0) {
      const { data: authData } = await supabase.auth.admin.listUsers()
      const emailMap = authData.users.reduce((acc, authUser) => {
        if (authUser.email) acc[authUser.id] = authUser.email
        return acc
      }, {} as Record<string, string>)

      const backupRecords = usersToBackup.map(u => ({
        original_user_id: u.id,
        first_name: u.first_name,
        last_name: u.last_name,
        email: emailMap[u.id] || '',
        company_name: company.name,
        points: u.points || 0,
        department: u.department,
        role: u.role,
        deleted_by: user.id
      }))

      const { error: backupError } = await supabase.from('backup_users').insert(backupRecords)
      if (backupError) {
        console.error('Failed to backup user data:', backupError)
        throw new Error('Step: backup_users — ' + backupError.message)
      }
      console.log('User data backed up successfully')
    }

    // Delete in correct FK-safe order
    const steps: { name: string; query: Promise<any> }[] = [
      // 1. Tables referencing profiles
      { name: 'point_transactions', query: supabase.from('point_transactions').delete().eq('company_id', companyId) },
      { name: 'celebration_rewards_log', query: supabase.from('celebration_rewards_log').delete().eq('company_id', companyId) },
      // 2. Other company-scoped tables
      { name: 'redemptions', query: supabase.from('redemptions').delete().eq('company_id', companyId) },
      { name: 'login_events', query: supabase.from('login_events').delete().eq('company_id', companyId) },
      { name: 'monthly_points_allocations', query: supabase.from('monthly_points_allocations').delete().eq('company_id', companyId) },
      { name: 'company_point_transactions', query: supabase.from('company_point_transactions').delete().eq('company_id', companyId) },
      // 3. Integrations
      { name: 'slack_integrations', query: supabase.from('slack_integrations').delete().eq('company_id', companyId) },
      { name: 'teams_integrations', query: supabase.from('teams_integrations').delete().eq('company_id', companyId) },
      // 4. Company structure
      { name: 'subscription_events', query: supabase.from('subscription_events').delete().eq('company_id', companyId) },
      { name: 'company_regions', query: supabase.from('company_regions').delete().eq('company_id', companyId) },
    ]

    // Execute deletions sequentially
    for (const step of steps) {
      const { error } = await step.query
      if (error) {
        console.error(`Deletion failed at step "${step.name}":`, error)
        throw new Error(`Step: ${step.name} — ${error.message}`)
      }
      console.log(`Deleted ${step.name}`)
    }

    // 5. Delete platform_product_blacklist entries by users in this company
    if (userIds.length > 0) {
      const { error } = await supabase
        .from('platform_product_blacklist')
        .delete()
        .in('disabled_by', userIds)
      if (error) {
        console.error('Deletion failed at step "platform_product_blacklist":', error)
        throw new Error('Step: platform_product_blacklist — ' + error.message)
      }
      console.log('Deleted platform_product_blacklist')
    }

    // 6. Deactivate profiles and detach from company AND departments
    const { error: deactivateError } = await supabase
      .from('profiles')
      .update({ status: 'deactivated', company_id: null, department_id: null })
      .eq('company_id', companyId)
    if (deactivateError) {
      console.error('Failed to deactivate profiles:', deactivateError)
      throw new Error('Step: deactivate_profiles — ' + deactivateError.message)
    }
    console.log('Profiles deactivated')

    // 7. Delete departments (now safe — profiles detached)
    const { error: deptError } = await supabase
      .from('departments')
      .delete()
      .eq('company_id', companyId)
    if (deptError) {
      console.error('Deletion failed at step "departments":', deptError)
      throw new Error('Step: departments — ' + deptError.message)
    }
    console.log('Deleted departments')

    // 8. Delete auth users (NOW safe — no FK references block profile cascade)
    if (userIds.length > 0) {
      console.log('Deleting auth users...')
      for (const userId of userIds) {
        const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(userId)
        if (deleteAuthError) {
          console.error('Failed to delete auth user:', userId, deleteAuthError)
        }
      }
      console.log('Auth users deleted')
    }

    // 8. Delete company
    const { error: deleteCompanyError } = await supabase.from('companies').delete().eq('id', companyId)
    if (deleteCompanyError) {
      console.error('Failed to delete company:', deleteCompanyError)
      throw new Error('Step: delete_company — ' + deleteCompanyError.message)
    }

    console.log('Company deleted successfully:', companyId)

    return new Response(
      JSON.stringify({ success: true, message: 'Company deleted successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error deleting company:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to delete company', details: error instanceof Error ? error.message : 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
