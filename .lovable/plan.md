

## Auto-Link Slack Users to Grattia Profiles

### How it works

**Auto-linking**: When triggered, the system fetches all Slack workspace users via `users.list` API, then matches each to a Grattia profile using normalized email (stripping `+alias` parts). Matches are saved as `slack_user_id` on the `profiles` table.

**Manual linking**: A UI in the company admin Settings page shows unlinked Slack users alongside a dropdown of unlinked Grattia profiles, letting the admin manually pair them.

### Changes

#### 1. Database migration
- Add `slack_user_id TEXT` column to `profiles` table
- Add unique index on `slack_user_id` (one Slack user per profile)

#### 2. New edge function: `slack-auto-link`
- Called by company admin (JWT-authenticated)
- Fetches company's `bot_token` from `slack_integrations`
- Calls Slack `users.list` to get all workspace members with emails
- For each Slack user:
  - Normalize email (strip `+alias` before `@`)
  - Match against `auth.users` emails (also normalized)
  - If match found and profile belongs to same company → set `profiles.slack_user_id`
- Returns: `{ linked: [...], unlinked: [...] }` so the frontend knows what still needs manual attention

#### 3. Update `slack-slash-command/index.ts`
- **Primary lookup**: Query `profiles` by `slack_user_id` (instant, exact)
- **Fallback**: Current email-based lookup with normalization (strip `+alias`)

#### 4. Admin UI in Settings (Slack section)
- "Link Slack Users" button triggers auto-link
- After auto-link, shows results: successfully linked users and unlinked Slack users
- Unlinked users get a dropdown to manually select a Grattia team member
- Admin can also unlink/relink existing mappings

### Flow summary

```text
Admin clicks "Link Slack Users"
         │
         ▼
  slack-auto-link edge function
         │
    Slack users.list API
         │
    Normalize emails, match to profiles
         │
    ┌────┴────┐
    │         │
 Linked    Unlinked
 (auto)    (show in UI for manual linking)
```

