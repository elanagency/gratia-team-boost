

# Update Celebration Email: Template ID and Remove Years of Service

## Changes

### 1. Update template ID from 11 to 12

**File: `supabase/functions/email-service/index.ts`**

Change the `celebration` case in `getBrevoTemplateId` from `return 11` to `return 12`.

### 2. Remove `yearsOfService` from anniversary email params

**File: `supabase/functions/process-celebration-rewards/index.ts`**

In the anniversary celebration email block, remove the `yearsOfService` field from `templateParams`. The email will only use `fname`, `rewardType`, and `points` -- matching the simplified Brevo template.

### Summary

| File | Change |
|------|--------|
| `supabase/functions/email-service/index.ts` | Template ID 11 to 12 |
| `supabase/functions/process-celebration-rewards/index.ts` | Remove `yearsOfService` from anniversary email `templateParams` |

Both edge functions will be redeployed after changes.

