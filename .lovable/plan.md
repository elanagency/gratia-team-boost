

## Separate `/give_recognition` Modal Command + Fix Signature Issue

### Summary

Two slash commands instead of one:
- `/grattia @user 50 message` -- keeps existing text-based flow (no changes)
- `/give_recognition` -- opens the Block Kit modal popup

Both commands will point to the same `slack-slash-command` edge function, which will check the `command` parameter to decide behavior.

### Root Cause of Current Issue

The `slack-interactions` function is failing with "Invalid signature". This is likely because Supabase's edge function infrastructure may be interfering with the raw body before our code reads it. The fix is to ensure we read the body correctly and add debug logging to diagnose if the issue persists.

### Implementation

**1. Update `slack-slash-command/index.ts`**
- Remove the "empty text = open modal" logic from `/grattia`
- Add a check for `params.get('command')`: if it equals `/give_recognition`, open the Block Kit modal
- `/grattia` stays purely text-based as before
- Add more detailed error logging for the `views.open` call

**2. Fix `slack-interactions/index.ts` signature verification**
- Add debug logging to capture the raw body length, timestamp, and signature headers
- Ensure the body string is read exactly once and used consistently
- Add a fallback: if `SLACK_SIGNING_SECRET` is empty/undefined, log an explicit error

**3. Slack App Dashboard (manual, one-time)**
- Create a new slash command `/give_recognition` pointing to the same URL: `https://kbjcjtycmfdjfnduxiud.supabase.co/functions/v1/slack-slash-command`
- The Interactivity Request URL stays as: `https://kbjcjtycmfdjfnduxiud.supabase.co/functions/v1/slack-interactions`

### Files Changed

| File | Change |
|------|--------|
| `supabase/functions/slack-slash-command/index.ts` | Route by `command` param: `/give_recognition` opens modal, `/grattia` stays text-only |
| `supabase/functions/slack-interactions/index.ts` | Add debug logging to signature verification for diagnosing failures |

### User Action Required After Deploy

In the Slack App Dashboard under **Slash Commands**, create a new command:
- Command: `/give_recognition`
- Request URL: `https://kbjcjtycmfdjfnduxiud.supabase.co/functions/v1/slack-slash-command`
- Short description: "Open a form to give recognition to a team member"

