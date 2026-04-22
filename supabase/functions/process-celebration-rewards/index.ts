import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'
import { corsHeaders } from '../_shared/cors.ts'

interface Company {
  id: string
  name: string
  birthday_rewards_enabled: boolean
  anniversary_rewards_enabled: boolean
  birthday_reward_points: number
  anniversary_reward_points: number
  environment: string | null
  stripe_customer_id_test: string | null
  stripe_customer_id_live: string | null
  stripe_subscription_id: string | null
}

interface Profile {
  id: string
  first_name: string | null
  last_name: string | null
  birthday: string | null
  company_start_date: string | null
  points: number
}

async function sendCelebrationNotifications(
  supabaseUrl: string,
  serviceKey: string,
  companyId: string,
  memberName: string,
  rewardType: 'birthday' | 'anniversary',
  points: number,
  yearsOfService?: number
) {
  const message = rewardType === 'birthday'
    ? `🎂 Happy Birthday to ${memberName}! They received ${points} celebration points`
    : `🎉 Happy Work Anniversary to ${memberName} (${yearsOfService} year${yearsOfService !== 1 ? 's' : ''})! They received ${points} celebration points`

  const title = rewardType === 'birthday' ? 'Birthday Celebration' : 'Work Anniversary Celebration'

  const notificationPayload = {
    company_id: companyId,
    notification_type: 'milestone',
    message,
    title,
    points,
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${serviceKey}`,
  }

  const calls = [
    fetch(`${supabaseUrl}/functions/v1/send-slack-notification`, {
      method: 'POST', headers, body: JSON.stringify(notificationPayload),
    }).catch(e => console.log('Slack notification skipped:', e.message)),
    fetch(`${supabaseUrl}/functions/v1/send-teams-notification`, {
      method: 'POST', headers, body: JSON.stringify(notificationPayload),
    }).catch(e => console.log('Teams notification skipped:', e.message)),
  ]

  await Promise.allSettled(calls)
}

/**
 * Create a Stripe invoice item for a celebration charge.
 * Returns { invoiceItemId, status } — status is 'pending' on success or 'failed' on error.
 */
async function createCelebrationInvoiceItem(params: {
  company: Company
  pointExchangeRate: number
  points: number
  description: string
}): Promise<{ invoiceItemId: string | null; status: 'pending' | 'failed'; error?: string }> {
  const { company, pointExchangeRate, points, description } = params

  const env = (company.environment || 'test').toLowerCase()
  const stripeKey = env === 'live'
    ? Deno.env.get('STRIPE_SECRET_KEY_LIVE')
    : Deno.env.get('STRIPE_SECRET_KEY_TEST')
  const customerId = env === 'live' ? company.stripe_customer_id_live : company.stripe_customer_id_test

  if (!stripeKey) {
    console.error(`Stripe key missing for env=${env}`)
    return { invoiceItemId: null, status: 'failed', error: 'stripe_key_missing' }
  }
  if (!customerId) {
    console.log(`Company ${company.id} has no Stripe customer for env=${env} — celebration logged as failed billing`)
    return { invoiceItemId: null, status: 'failed', error: 'no_stripe_customer' }
  }

  const dollarAmount = points * pointExchangeRate
  const amountInCents = Math.round(dollarAmount * 100)

  if (amountInCents <= 0) {
    return { invoiceItemId: null, status: 'failed', error: 'zero_amount' }
  }

  try {
    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' })
    const invoiceItem = await stripe.invoiceItems.create({
      customer: customerId,
      amount: amountInCents,
      currency: 'usd',
      description,
      ...(company.stripe_subscription_id ? { subscription: company.stripe_subscription_id } : {}),
    })
    return { invoiceItemId: invoiceItem.id, status: 'pending' }
  } catch (err) {
    console.error(`Stripe invoice item creation failed for company ${company.id}:`, err)
    return { invoiceItemId: null, status: 'failed', error: err instanceof Error ? err.message : 'unknown' }
  }
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

    // Fetch point exchange rate from platform_settings
    const { data: rateSetting } = await supabase
      .from('platform_settings')
      .select('point_exchange_rate')
      .eq('key', 'platform_settings')
      .maybeSingle()
    const pointExchangeRate = rateSetting?.point_exchange_rate ?? 0.05

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseServiceKey}`,
    }

    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentDay = now.getDate()
    const currentYear = now.getFullYear()

    console.log(`Processing celebration rewards for ${currentYear}-${currentMonth}-${currentDay} (rate=$${pointExchangeRate}/pt)`)

    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name, birthday_rewards_enabled, anniversary_rewards_enabled, birthday_reward_points, anniversary_reward_points, environment, stripe_customer_id_test, stripe_customer_id_live, stripe_subscription_id')
      .or('birthday_rewards_enabled.eq.true,anniversary_rewards_enabled.eq.true')

    if (companiesError) {
      console.error('Error fetching companies:', companiesError)
      throw companiesError
    }

    if (!companies || companies.length === 0) {
      return new Response(JSON.stringify({ message: 'No companies to process', processed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    let totalBirthdayRewards = 0
    let totalAnniversaryRewards = 0
    let totalBillingFailed = 0

    for (const company of companies as Company[]) {
      const { data: members, error: membersError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, birthday, company_start_date, points')
        .eq('company_id', company.id)
        .eq('status', 'active')

      if (membersError) {
        console.error(`Error fetching members for company ${company.id}:`, membersError)
        continue
      }
      if (!members || members.length === 0) continue

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

      const processCelebration = async (
        member: Profile,
        rewardType: 'birthday' | 'anniversary',
        points: number,
        descriptionFn: () => string,
        notificationFn: () => Promise<void>,
        emailRewardType: 'birthday' | 'anniversary'
      ) => {
        // Credit recipient
        const { error: creditError } = await supabase
          .from('profiles')
          .update({ points: member.points + points })
          .eq('id', member.id)

        if (creditError) {
          console.error(`Error crediting ${rewardType} points to ${member.id}:`, creditError)
          return false
        }

        const dollarAmount = +(points * pointExchangeRate).toFixed(2)
        const memberName = `${member.first_name || ''} ${member.last_name || ''}`.trim() || 'Team Member'
        const stripeDescription = rewardType === 'birthday'
          ? `🎂 Birthday celebration — ${memberName}`
          : `🎉 Work anniversary celebration — ${memberName}`

        // Create Stripe invoice item (post-pay)
        const billing = await createCelebrationInvoiceItem({
          company,
          pointExchangeRate,
          points,
          description: stripeDescription,
        })

        if (billing.status === 'failed') totalBillingFailed++

        // Log celebration with billing snapshot
        await supabase.from('celebration_rewards_log').insert({
          company_id: company.id,
          profile_id: member.id,
          reward_type: rewardType,
          points_awarded: points,
          event_date: `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`,
          year: currentYear,
          dollar_amount: dollarAmount,
          stripe_invoice_item_id: billing.invoiceItemId,
          billing_status: billing.status,
        })

        // point_transactions row (recipient as sender for system rewards)
        await supabase.from('point_transactions').insert({
          company_id: company.id,
          sender_profile_id: member.id,
          recipient_profile_id: member.id,
          points,
          description: descriptionFn(),
        })

        await notificationFn()

        // Email
        try {
          const { data: userData } = await supabase.auth.admin.getUserById(member.id)
          if (userData?.user?.email) {
            await fetch(`${supabaseUrl}/functions/v1/email-service`, {
              method: 'POST',
              headers,
              body: JSON.stringify({
                type: 'celebration',
                to: userData.user.email,
                toName: memberName,
                templateParams: {
                  fname: member.first_name || 'Team Member',
                  rewardType: emailRewardType,
                  points,
                },
              }),
            })
          }
        } catch (e) {
          console.log(`${rewardType} celebration email skipped:`, (e as Error).message)
        }

        return true
      }

      // Birthdays
      if (company.birthday_rewards_enabled && company.birthday_reward_points > 0) {
        for (const member of members as Profile[]) {
          if (!member.birthday) continue
          const bday = new Date(member.birthday)
          if (bday.getMonth() + 1 !== currentMonth || bday.getDate() !== currentDay) continue
          if (alreadyRewarded.has(`${member.id}_birthday`)) continue

          const firstName = member.first_name || 'Team Member'
          const ok = await processCelebration(
            member,
            'birthday',
            company.birthday_reward_points,
            () => `🎂 Today is ${firstName}'s Birthday!`,
            () => sendCelebrationNotifications(
              supabaseUrl,
              supabaseServiceKey,
              company.id,
              `${member.first_name || ''} ${member.last_name || ''}`.trim() || 'Team Member',
              'birthday',
              company.birthday_reward_points,
            ),
            'birthday',
          )
          if (ok) totalBirthdayRewards++
        }
      }

      // Anniversaries
      if (company.anniversary_rewards_enabled && company.anniversary_reward_points > 0) {
        for (const member of members as Profile[]) {
          if (!member.company_start_date) continue
          const startDate = new Date(member.company_start_date)
          if (startDate.getFullYear() === currentYear) continue
          if (startDate.getMonth() + 1 !== currentMonth || startDate.getDate() !== currentDay) continue
          if (alreadyRewarded.has(`${member.id}_anniversary`)) continue

          const fullName = `${member.first_name || ''} ${member.last_name || ''}`.trim() || 'Team Member'
          const yearsOfService = currentYear - startDate.getFullYear()

          const ok = await processCelebration(
            member,
            'anniversary',
            company.anniversary_reward_points,
            () => `🎉 Today is ${fullName}'s ${yearsOfService} year work anniversary!`,
            () => sendCelebrationNotifications(
              supabaseUrl,
              supabaseServiceKey,
              company.id,
              fullName,
              'anniversary',
              company.anniversary_reward_points,
              yearsOfService,
            ),
            'anniversary',
          )
          if (ok) totalAnniversaryRewards++
        }
      }
    }

    const summary = {
      message: 'Celebration rewards processed',
      date: `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`,
      birthday_rewards: totalBirthdayRewards,
      anniversary_rewards: totalAnniversaryRewards,
      billing_failed: totalBillingFailed,
      companies_processed: companies.length,
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
