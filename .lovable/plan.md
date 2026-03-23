

## Slack Recognition: Shortcut + Slash Command

### Current Setup

Two ways to give recognition from Slack:
1. **`/grattia @user 50 message`** — legacy text-based slash command
2. **"Give recognition" shortcut** — opens a Block Kit modal (appears in Slack's shortcuts menu without a `/`)

### Architecture

| Component | Responsibility |
|-----------|---------------|
| `slack-slash-command` | Handles only `/grattia` text parsing and point transfers |
| `slack-interactions` | Handles Global Shortcut (`type=shortcut`, callback_id=`give_recognition`) to open modal, AND `view_submission` to process the modal form |

### Slack App Dashboard Configuration

**Slash Commands:**
- Keep exactly one `/grattia` → `https://kbjcjtycmfdjfnduxiud.supabase.co/functions/v1/slack-slash-command`
- Delete all `/give_recognition` entries and any duplicate `/grattia` entries

**Interactivity & Shortcuts:**
- Interactivity Request URL: `https://kbjcjtycmfdjfnduxiud.supabase.co/functions/v1/slack-interactions`
- Global Shortcut:
  - Name: `Give recognition`
  - Callback ID: `give_recognition`
  - Description: "Open a form to give recognition to a team member"

### Signature Verification

Both edge functions verify requests using `SLACK_SIGNING_SECRET`. If signatures fail:
1. Confirm the secret in Supabase matches the **Signing Secret** from the Slack App's Basic Information page
2. Check edge function logs for debug output (body length, timestamp, signature presence)
