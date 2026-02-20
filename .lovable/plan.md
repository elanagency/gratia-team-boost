

# Add Email Notification for Point Recognition

## Overview

When someone gives points to a coworker, an email notification will be sent to the recipient -- regardless of whether Slack or Teams is configured. This ensures every recognition is seen.

## Changes

### 1. Add `recognition` email type to the email service

**File: `supabase/functions/email-service/index.ts`**

- Add `'recognition'` to the `EmailServiceRequest` type union
- Add a new case in `getBrevoTemplateId` mapping `'recognition'` to a new Brevo template ID (13, next available)

### 2. Send recognition email from GivePointsDialog after successful transfer

**File: `src/components/points/GivePointsDialog.tsx`**

In the `onSuccess` callback (after the Slack and Teams notification calls), add a call to the `email-service` edge function:

- Fetch the recipient's email using the existing `get-user-emails` edge function (already built), passing the recipient's `user_id`
- Call `email-service` with type `'recognition'`, the recipient's email, and template params: `senderName`, `points`, `message`
- Wrap in try/catch so a failed email never blocks the recognition flow

### 3. Brevo Template Setup (Manual Step)

You will need to create **Brevo Template ID 13** for recognition emails with these dynamic variables:

- `{{ params.senderName }}` -- name of the person giving points
- `{{ params.points }}` -- number of points given
- `{{ params.message }}` -- the recognition message

**Suggested email body for Brevo:**

Subject: **You've been recognized!**

```
Hi {{ params.recipientName }},

Great news -- {{ params.senderName }} just gave you {{ params.points }} points!

Their message: "{{ params.message }}"

Log in to Grattia to see your updated points balance and explore the reward shop.

-- The Grattia Team
```

## Technical Details

| File | Change |
|------|--------|
| `supabase/functions/email-service/index.ts` | Add `recognition` type mapped to Brevo template 13 |
| `src/components/points/GivePointsDialog.tsx` | Send recognition email to recipient after successful transfer |

- No database changes needed
- No new edge functions needed -- reuses `email-service` and `get-user-emails`
- The email is fire-and-forget (caught errors are logged but don't affect the user flow)

