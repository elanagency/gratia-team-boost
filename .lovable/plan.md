

# Fix Celebration Notifications (Slack/Teams) and Add Celebration Email

## Problems Found

### 1. Runtime crash in anniversary processing (Critical Bug)
Lines 258 and 268 of `process-celebration-rewards/index.ts` both declare `const yearsOfService`. This duplicate `const` declaration causes a JavaScript runtime error, which means:
- Anniversary rewards silently fail after the point_transactions insert
- The notification call on line 269 is never reached
- The error is swallowed by the catch block

### 2. Slack/Teams notifications depend on company integration setup
The notification flow itself is correctly wired -- `process-celebration-rewards` calls `send-slack-notification` and `send-teams-notification` with `notification_type: 'milestone'`. Both functions check `team_milestones` in notification settings. This works when:
- The company has Slack/Teams connected
- The `team_milestones` toggle is enabled

For the test company (Gymshark), neither integration is connected, which is expected. The main blocker is the duplicate variable bug above.

### 3. No celebration email template
The email service only supports `invitation` (template 8), `welcome` (template 5), and `redemption` (template 10). No celebration type exists.

## Changes

### File 1: `supabase/functions/process-celebration-rewards/index.ts`

**Fix duplicate variable declaration (lines 257-269)**

Remove the second `const memberName` and `const yearsOfService` declarations. Reuse `anniversaryFullName` and the first `yearsOfService` for the notification call:

```
// Before (broken):
const anniversaryFullName = ...
const yearsOfService = ...    // first declaration
await supabase.from('point_transactions').insert(...)

const memberName = ...        // redundant
const yearsOfService = ...    // DUPLICATE - causes crash
await sendCelebrationNotifications(...)

// After (fixed):
const anniversaryFullName = ...
const yearsOfService = ...
await supabase.from('point_transactions').insert(...)

await sendCelebrationNotifications(..., anniversaryFullName, 'anniversary', ..., yearsOfService)
```

**Add celebration email sending after each reward**

After the Slack/Teams notification calls for both birthday and anniversary blocks, add a call to the email-service edge function:

```ts
// Send celebration email to the member
const recipientEmail = // need to fetch from auth or store in profile
await fetch(`${supabaseUrl}/functions/v1/email-service`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    type: 'celebration',
    to: recipientEmail,
    toName: memberName,
    templateParams: {
      fname: member.first_name || 'Team Member',
      rewardType: 'birthday', // or 'anniversary'
      points: company.birthday_reward_points,
      yearsOfService: undefined // or number for anniversary
    }
  })
}).catch(e => console.log('Celebration email skipped:', e.message))
```

To get the member's email, the function needs to query profiles joined with auth or store email in profiles. Since the function already uses the service role key, it can look up the user's email via `supabaseAdmin.auth.admin.getUserById(member.id)`.

### File 2: `supabase/functions/email-service/index.ts`

Add `celebration` as a supported email type:

- Add `'celebration'` to the `EmailServiceRequest` type union
- Add a case in `getBrevoTemplateId` for `'celebration'` returning a new Brevo template ID (you will need to create this template in Brevo first)
- Suggested template ID: 11 (next available after redemption at 10)

```ts
// Updated type
type: 'invitation' | 'welcome' | 'redemption' | 'celebration';

// Updated template mapping
case 'celebration':
  return 11; // Birthday/anniversary celebration template
```

### Brevo Template Setup (Manual Step)

You will need to create Template ID 11 in your Brevo dashboard with these template parameters:
- `fname` -- recipient's first name
- `rewardType` -- "birthday" or "anniversary"
- `points` -- number of points awarded
- `yearsOfService` -- years of service (only for anniversary, omitted for birthday)

Example subject line: "You received celebration points!"

## Summary of file changes

| File | Change |
|------|--------|
| `supabase/functions/process-celebration-rewards/index.ts` | Fix duplicate `const` crash, add email call, fetch member email |
| `supabase/functions/email-service/index.ts` | Add `celebration` type mapping to template ID 11 |

## What the user needs to do manually

1. Create Brevo email template ID 11 for celebration notifications
2. Connect Slack or Teams for the test company (Gymshark) if they want to verify those notifications
3. Enable "Team Milestones" toggle in the Slack/Teams notification settings

