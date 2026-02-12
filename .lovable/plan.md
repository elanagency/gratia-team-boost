

# Wire Redemption Email (Brevo Template 10)

## Overview

Two small changes to connect the new Brevo redemption template (ID 10) to the gift card redemption flow.

## Changes

### 1. `supabase/functions/email-service/index.ts`

- Add `'redemption'` to the `EmailServiceRequest` type union
- Add a case in `getBrevoTemplateId` mapping `'redemption'` to template ID `10`

### 2. `supabase/functions/giftbit-redemption-service/index.ts`

- After the redemption record is created and points are deducted (around line 209), add a call to the `email-service` edge function
- Send the following payload:
  - `type`: `'redemption'`
  - `to`: `recipientEmail` (the user's email from the request body)
  - `toName`: `recipientFirstName + ' ' + recipientLastName`
  - `templateParams`: `{ fname: recipientFirstName, brandName, dollarAmount, pointsSpent: pointsRequired, giftLink: claimLink }`
- The email call will be fire-and-forget (log errors but don't fail the redemption response)
- Uses the Supabase URL and service role key already available in the function to call the email-service internally via `fetch`

### Technical Notes

- The email is sent as a secondary action; if it fails, the redemption still succeeds and the user still gets their claim link in the UI
- The internal call to email-service uses the `SUPABASE_URL` + `/functions/v1/email-service` path with the `SUPABASE_ANON_KEY` for authorization (service-to-service call pattern already established in this codebase)

