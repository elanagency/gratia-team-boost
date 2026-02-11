import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

interface Company {
  id: string
  birthday_rewards_enabled: boolean
  anniversary_rewards_enabled: boolean
  birthday_reward_points: number
  anniversary_reward_points: number
  points_balance: number
}

interface Profile {
  id: string
  birthday: string | null
  company_start_date: string | null
  points: number
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentDay = now.getDate()
    const currentYear = now.getFullYear()

    console.log(`Processing celebration rewards for ${currentYear}-${currentMonth}-${currentDay}`)

    // Get all companies with at least one celebration type enabled
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, birthday_rewards_enabled, anniversary_rewards_enabled, birthday_reward_points, anniversary_reward_points, points_balance')
      .or('birthday_rewards_enabled.eq.true,anniversary_rewards_enabled.eq.true')

    if (companiesError) {
      console.error('Error fetching companies:', companiesError)
      throw companiesError
    }

    if (!companies || companies.length === 0) {
      console.log('No companies with celebrations enabled')
      return new Response(JSON.stringify({ message: 'No companies to process', processed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    let totalBirthdayRewards = 0
    let totalAnniversaryRewards = 0
    let totalSkippedInsufficient = 0

    for (const company of companies as Company[]) {
      // Get active members for this company
      const { data: members, error: membersError } = await supabase
        .from('profiles')
        .select('id, birthday, company_start_date, points')
        .eq('company_id', company.id)
        .eq('status', 'active')

      if (membersError) {
        console.error(`Error fetching members for company ${company.id}:`, membersError)
        continue
      }

      if (!members || members.length === 0) continue

      // Get existing rewards for this year to avoid duplicates
      const { data: existingLogs, error: logsError } = await supabase
        .from('celebration_rewards_log')
        .select('profile_id, reward_type')
        .eq('company_id', company.id)
        .eq('year', currentYear)

      if (logsError) {
        console.error(`Error fetching logs for company ${company.id}:`, logsError)
        continue
      }

      const alreadyRewarded = new Set(
        (existingLogs || []).map(l => `${l.profile_id}_${l.reward_type}`)
      )

      let companyBalance = company.points_balance

      // Process birthdays
      if (company.birthday_rewards_enabled && company.birthday_reward_points > 0) {
        for (const member of members as Profile[]) {
          if (!member.birthday) continue

          const bday = new Date(member.birthday)
          if (bday.getMonth() + 1 !== currentMonth || bday.getDate() !== currentDay) continue
          if (alreadyRewarded.has(`${member.id}_birthday`)) continue

          if (companyBalance < company.birthday_reward_points) {
            console.log(`Insufficient balance for company ${company.id}, skipping remaining birthday rewards`)
            totalSkippedInsufficient++
            continue
          }

          // Deduct from company wallet
          companyBalance -= company.birthday_reward_points
          const { error: walletError } = await supabase
            .from('companies')
            .update({ points_balance: companyBalance })
            .eq('id', company.id)

          if (walletError) {
            console.error(`Error updating wallet for company ${company.id}:`, walletError)
            companyBalance += company.birthday_reward_points // rollback local
            continue
          }

          // Credit employee points
          const { error: creditError } = await supabase
            .from('profiles')
            .update({ points: member.points + company.birthday_reward_points })
            .eq('id', member.id)

          if (creditError) {
            console.error(`Error crediting birthday points to ${member.id}:`, creditError)
            // Rollback wallet
            companyBalance += company.birthday_reward_points
            await supabase.from('companies').update({ points_balance: companyBalance }).eq('id', company.id)
            continue
          }

          // Log to celebration_rewards_log
          await supabase.from('celebration_rewards_log').insert({
            company_id: company.id,
            profile_id: member.id,
            reward_type: 'birthday',
            points_awarded: company.birthday_reward_points,
            event_date: `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`,
            year: currentYear
          })

          // Create point_transactions record (use recipient as sender for system rewards)
          await supabase.from('point_transactions').insert({
            company_id: company.id,
            sender_profile_id: member.id,
            recipient_profile_id: member.id,
            points: company.birthday_reward_points,
            description: `🎂 Birthday reward`
          })

          totalBirthdayRewards++
          console.log(`Birthday reward: ${company.birthday_reward_points} pts to ${member.id} in company ${company.id}`)
        }
      }

      // Process anniversaries
      if (company.anniversary_rewards_enabled && company.anniversary_reward_points > 0) {
        for (const member of members as Profile[]) {
          if (!member.company_start_date) continue

          const startDate = new Date(member.company_start_date)
          // Skip if they started this year (no anniversary yet)
          if (startDate.getFullYear() === currentYear) continue
          if (startDate.getMonth() + 1 !== currentMonth || startDate.getDate() !== currentDay) continue
          if (alreadyRewarded.has(`${member.id}_anniversary`)) continue

          if (companyBalance < company.anniversary_reward_points) {
            console.log(`Insufficient balance for company ${company.id}, skipping remaining anniversary rewards`)
            totalSkippedInsufficient++
            continue
          }

          companyBalance -= company.anniversary_reward_points
          const { error: walletError } = await supabase
            .from('companies')
            .update({ points_balance: companyBalance })
            .eq('id', company.id)

          if (walletError) {
            console.error(`Error updating wallet for company ${company.id}:`, walletError)
            companyBalance += company.anniversary_reward_points
            continue
          }

          const { error: creditError } = await supabase
            .from('profiles')
            .update({ points: member.points + company.anniversary_reward_points })
            .eq('id', member.id)

          if (creditError) {
            console.error(`Error crediting anniversary points to ${member.id}:`, creditError)
            companyBalance += company.anniversary_reward_points
            await supabase.from('companies').update({ points_balance: companyBalance }).eq('id', company.id)
            continue
          }

          await supabase.from('celebration_rewards_log').insert({
            company_id: company.id,
            profile_id: member.id,
            reward_type: 'anniversary',
            points_awarded: company.anniversary_reward_points,
            event_date: `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`,
            year: currentYear
          })

          await supabase.from('point_transactions').insert({
            company_id: company.id,
            sender_profile_id: member.id,
            recipient_profile_id: member.id,
            points: company.anniversary_reward_points,
            description: `🎉 Work anniversary reward`
          })

          totalAnniversaryRewards++
          console.log(`Anniversary reward: ${company.anniversary_reward_points} pts to ${member.id} in company ${company.id}`)
        }
      }
    }

    const summary = {
      message: 'Celebration rewards processed',
      date: `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`,
      birthday_rewards: totalBirthdayRewards,
      anniversary_rewards: totalAnniversaryRewards,
      skipped_insufficient_balance: totalSkippedInsufficient,
      companies_processed: companies.length
    }

    console.log('Processing complete:', JSON.stringify(summary))

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in process-celebration-rewards:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
