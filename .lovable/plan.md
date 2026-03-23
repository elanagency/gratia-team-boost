

## Fix: Remove Duplicate Slack Recognition Message

### Problem
When the "Give recognition" shortcut modal submits successfully, `slack-interactions` posts **two** messages:
1. A direct `chat.postMessage` call (line 334-348)
2. An invocation of `send-slack-notification` edge function (line 350-363), which posts its own `chat.postMessage`

### Fix
Remove the direct `chat.postMessage` call (lines 334-348). Keep only the `send-slack-notification` invocation, which produces the richer "Recognition Alert" formatted message with blocks.

### Duplicate `/grattia` commands
This is a **Slack App Dashboard configuration issue**, not a code problem. You have the same slash command registered multiple times. Go to https://api.slack.com/apps → your Grattia app → **Features → Slash Commands** and delete the duplicate entries, keeping only one `/grattia` command.

### File changed

| File | Change |
|------|--------|
| `supabase/functions/slack-interactions/index.ts` | Remove lines 334-348 (the direct `chat.postMessage` block) |

