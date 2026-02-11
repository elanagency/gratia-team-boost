

# Add Celebration Notifications to Slack and Teams

## Overview

After each successful birthday or anniversary reward is distributed, the `process-celebration-rewards` edge function will send a notification to Slack and/or Teams (if connected and the `team_milestones` notification type is enabled).

## What Changes

Only **one file** needs to be updated: `supabase/functions/process-celebration-rewards/index.ts`

### Changes to the function:

1. **Fetch member names** -- Update the profiles query to also select `first_name, last_name` so we can include the employee's name in the notification message

2. **Add a helper function** `sendCelebrationNotifications(supabaseUrl, companyId, memberName, rewardType, points)` that:
   - Calls `send-slack-notification` with `notification_type: 'milestone'` and a celebration-specific message (e.g. "Happy Birthday to Sarah Johnson! She received 50 points")
   - Calls `send-teams-notification` with the same `notification_type: 'milestone'` payload
   - Both calls are fire-and-forget (wrapped in try/catch so a notification failure never blocks the reward)
   - Uses the function's own `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to call the sibling functions via their HTTP endpoints

3. **Call the helper** after each successful birthday reward and anniversary reward (after the `celebration_rewards_log` insert succeeds)

### Message format examples:

- Birthday: "Happy Birthday to Sarah Johnson! She received 50 celebration points"
- Anniversary: "Happy Work Anniversary to John Smith (3 years)! He received 100 celebration points"

For anniversaries, the years of service will be calculated from `company_start_date`.

### Notification routing:

Both Slack and Teams notification functions already handle:
- Checking if the company has the integration connected
- Checking if the `team_milestones` notification type is enabled
- Gracefully returning if not connected or disabled

So the celebration function simply fires the requests and does not need to worry about whether the company uses Slack, Teams, both, or neither.

## No UI changes needed

The existing notification settings already have a "Team Milestones" toggle in both Slack and Teams settings cards. Celebration notifications will flow through that existing toggle -- no new UI controls required.

## Technical Details

### Updated Profile interface
```
interface Profile {
  id: string
  first_name: string | null
  last_name: string | null
  birthday: string | null
  company_start_date: string | null
  points: number
}
```

### Notification helper (called within the function)
```
async function sendCelebrationNotifications(
  supabaseUrl: string,
  serviceKey: string,
  companyId: string,
  memberName: string,
  rewardType: 'birthday' | 'anniversary',
  points: number,
  yearsOfService?: number
)
```

This calls both `/functions/v1/send-slack-notification` and `/functions/v1/send-teams-notification` with the appropriate payload, catching errors silently.
