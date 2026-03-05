

## Slack Slash Command — `/grattia`

### Single new edge function

**`supabase/functions/slack-slash-command/index.ts`**

Slack sends slash commands as `application/x-www-form-urlencoded` POST with fields: `team_id`, `user_id`, `text`, `response_url`.

Flow:
1. Verify request signature using `SLACK_SIGNING_SECRET` (timestamp + HMAC-SHA256)
2. Parse `text` — expected format: `@user [points] [message]`
3. Use `team_id` to look up the company's `slack_integrations` row (get `bot_token` + `company_id`)
4. Call Slack API `users.info` with sender's `user_id` → get email
5. Resolve mentioned user's Slack ID from text → `users.info` → get email
6. Look up both emails in `auth.users` → get Supabase user IDs
7. Call `transfer_points_between_users` RPC with sender, recipient, company, points, message
8. Return Slack-formatted JSON response (ephemeral or in-channel)

### Config update

**`supabase/config.toml`** — add:
```toml
[functions.slack-slash-command]
verify_jwt = false
```

`verify_jwt = false` because Slack authenticates via its own signing secret, not JWT.

### Manual step (you do this in Slack App Dashboard)

1. Go to [Slack App Dashboard](https://api.slack.com/apps) → your Grattia app → Slash Commands
2. Add command `/grattia` with Request URL: `https://kbjcjtycmfdjfnduxiud.supabase.co/functions/v1/slack-slash-command`
3. Set usage hint: `@user [points] [message]`
4. Reinstall app to workspace

### No new secrets, no DB changes, no frontend changes

Everything needed already exists.

