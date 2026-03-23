import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

function generateSecurePassword(): string {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const pw = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
  ];
  const all = upper + lower + digits;
  while (pw.length < 8) pw.push(all[Math.floor(Math.random() * all.length)]);
  return pw.sort(() => Math.random() - 0.5).join('');
}

function parseFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return { firstName: parts[0] || '', lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const userClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify admin
    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('company_id, is_admin')
      .eq('id', user.id)
      .single();

    if (!callerProfile?.is_admin || !callerProfile.company_id) {
      return new Response(JSON.stringify({ error: 'Only company admins can import Slack members' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const companyId = callerProfile.company_id;
    const body = await req.json();
    const { members, origin } = body;

    if (!members || !Array.isArray(members) || members.length === 0) {
      return new Response(JSON.stringify({ error: 'members array is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get company info
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('name, subscription_status, stripe_subscription_id')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      return new Response(JSON.stringify({ error: 'Failed to fetch company' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[BULK-INVITE-SLACK] Processing ${members.length} members for company ${companyId}`);

    const results: Array<{
      name: string;
      email: string;
      success: boolean;
      error?: string;
      isNewUser?: boolean;
      userId?: string;
    }> = [];
    let successCount = 0;
    let failureCount = 0;

    for (const member of members) {
      const { slack_user_id, email, name, department, role = 'member' } = member;

      try {
        // Try to create user
        let userId: string;
        let isNewUser = false;
        let password: string | undefined;

        password = generateSecurePassword();
        const { firstName, lastName } = parseFullName(name);

        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { firstName, lastName },
        });

        if (createError) {
          if (createError.message?.includes('already been registered') || (createError as any).code === 'email_exists') {
            // Find existing user
            const { data: allUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 });
            const existing = allUsers?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
            if (!existing?.id) {
              results.push({ name, email, success: false, error: 'User exists but could not be found' });
              failureCount++;
              continue;
            }
            userId = existing.id;
            password = undefined;
          } else {
            results.push({ name, email, success: false, error: 'Failed to create user account' });
            failureCount++;
            continue;
          }
        } else {
          userId = newUser.user.id;
          isNewUser = true;
        }

        // Check if already a member of this company
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', userId)
          .eq('company_id', companyId)
          .maybeSingle();

        if (existingProfile) {
          // Just update slack_user_id if not already set
          await supabase
            .from('profiles')
            .update({ slack_user_id })
            .eq('id', userId)
            .eq('company_id', companyId);

          results.push({ name, email, success: true, isNewUser: false, userId });
          successCount++;
          continue;
        }

        // Handle department
        let departmentId = null;
        if (department?.trim()) {
          const { data: existingDept } = await supabase
            .from('departments')
            .select('id')
            .eq('company_id', companyId)
            .eq('name', department.trim())
            .eq('is_active', true)
            .maybeSingle();

          if (existingDept) {
            departmentId = existingDept.id;
          } else {
            const { data: newDept } = await supabase
              .from('departments')
              .insert({ name: department.trim(), company_id: companyId })
              .select('id')
              .single();
            if (newDept) departmentId = newDept.id;
          }
        }

        const { firstName: fn, lastName: ln } = parseFullName(name);

        // Upsert profile with slack_user_id pre-set
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            first_name: fn,
            last_name: ln,
            company_id: companyId,
            is_admin: false,
            role: role.toLowerCase(),
            department_id: departmentId,
            department: department || null,
            points: 0,
            monthly_points: 100,
            status: 'invited',
            temporary_password: password || null,
            slack_user_id: slack_user_id, // Key differentiator: pre-linked
          });

        if (profileError) {
          console.error(`[BULK-INVITE-SLACK] Profile error for ${email}:`, profileError);
          results.push({ name, email, success: false, error: 'Failed to add user to company' });
          failureCount++;
          continue;
        }

        // Send invitation email
        if (authHeader && origin) {
          try {
            await fetch(`${SUPABASE_URL}/functions/v1/send-invitation-email`, {
              method: 'POST',
              headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json',
                'apikey': Deno.env.get('SUPABASE_ANON_KEY') || '',
              },
              body: JSON.stringify({
                email,
                name,
                companyName: company.name,
                isNewUser,
                password: isNewUser ? password : undefined,
                origin,
              }),
            });
          } catch (emailErr) {
            console.warn(`[BULK-INVITE-SLACK] Email failed for ${email}:`, emailErr);
          }
        }

        results.push({ name, email, success: true, isNewUser, userId });
        successCount++;
      } catch (err) {
        console.error(`[BULK-INVITE-SLACK] Error processing ${email}:`, err);
        results.push({ name, email, success: false, error: 'Internal error' });
        failureCount++;
      }
    }

    console.log(`[BULK-INVITE-SLACK] Done: ${successCount} success, ${failureCount} failed`);

    return new Response(JSON.stringify({
      successCount,
      failureCount,
      total: members.length,
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[BULK-INVITE-SLACK] Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
