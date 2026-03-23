

## Implement Slack Block Kit Modal for `/grattia` Command

### What Changes

Instead of parsing `/grattia @user 50 Great job!` as raw text, typing `/grattia` will open a native Slack modal (like Google Calendar's "Create Event") with structured form fields: a user picker, points input, and message textarea. This eliminates typos, invalid formats, and user lookup failures.

### How It Works

```text
User types /grattia
       ↓
Slack sends trigger_id to slack-slash-command
       ↓
Edge function calls views.open with Block Kit modal
       ↓
User fills form: [Select User ▾] [Points: 50] [Message...]
       ↓
User clicks Submit
       ↓
Slack sends view_submission payload to slack-interactions
       ↓
Edge function processes transfer + posts confirmation
```

### Implementation

**1. Update `slack-slash-command/index.ts`**
- When command text is empty (just `/grattia`), extract `trigger_id` from the request and call Slack's `views.open` API with a Block Kit modal containing:
  - `users_select` block — native Slack user picker (shows avatars, searchable)
  - `plain_text_input` block — points (with placeholder "50")
  - `plain_text_input` block — recognition message (multiline)
- When command text is provided (e.g. `/grattia @user 50 message`), keep existing text-parsing logic as fallback
- The modal's `callback_id` will be `grattia_recognition`

**2. Create `slack-interactions/index.ts`** (new edge function)
- Handles Slack's `view_submission` interaction payload (POST, form-encoded with a `payload` JSON field)
- Verifies Slack signature using the same `SLACK_SIGNING_SECRET`
- Extracts `selected_user` (Slack user ID), `points`, and `message` from the modal submission values
- Runs the same user resolution + `transfer_points_between_users` RPC logic currently in `slack-slash-command`
- On success, posts an in-channel message via `chat.postMessage` to the company's default channel
- Returns a `response_action: "clear"` to close the modal
- On error, returns `response_action: "errors"` with field-level error messages shown inline in the modal

**3. Slack App Dashboard Configuration** (manual, one-time)
- Enable **Interactivity** in the Slack app settings
- Set the **Request URL** to the new edge function: `https://kbjcjtycmfdjfnduxiud.supabase.co/functions/v1/slack-interactions`
- No new scopes needed — `views.open` and `chat.postMessage` are covered by existing bot scopes

### Files Changed

| File | Change |
|------|--------|
| `supabase/functions/slack-slash-command/index.ts` | Add `trigger_id` extraction + `views.open` call when text is empty; keep text parsing as fallback |
| `supabase/functions/slack-interactions/index.ts` | New — handles `view_submission`, resolves users, transfers points, posts confirmation |

### No Database Changes

Uses existing `transfer_points_between_users` RPC, `slack_integrations` table, and `profiles.slack_user_id` column.

### User Action Required After Deploy

One manual step in the Slack App Dashboard: enable Interactivity and paste the `slack-interactions` edge function URL. Instructions will be provided.

