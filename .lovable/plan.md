

# Upgrade Microsoft Teams Integration to OAuth + Channel Picker

## Overview

Replace the current webhook-paste approach with a proper OAuth browser authentication flow (identical pattern to the existing Slack integration). Users will click "Connect to Microsoft Teams," sign in via Microsoft in the browser, and then select their Team and Channel from dropdowns populated by the Microsoft Graph API.

---

## Prerequisites (Manual Setup Required)

Before implementation, you need to register an app in **Microsoft Entra ID (Azure AD)**:

1. Go to [Azure Portal](https://portal.azure.com) > Microsoft Entra ID > App registrations > New registration
2. Set redirect URI to your app's settings page (e.g., `https://gratia-team-boost.lovable.app/dashboard/settings`)
3. Under API Permissions, add Microsoft Graph **delegated** permissions:
   - `Team.ReadBasic.All` (list teams the user belongs to)
   - `Channel.ReadBasic.All` (list channels in a team)
   - `ChannelMessage.Send` (send messages to channels)
4. Create a client secret under Certificates & Secrets
5. Store `MS_TEAMS_CLIENT_ID` and `MS_TEAMS_CLIENT_SECRET` as Supabase Edge Function secrets

---

## Implementation Plan

### 1. New Edge Function: `teams-oauth-url`
Generates the Microsoft OAuth authorization URL and redirects the user.

- Reads `MS_TEAMS_CLIENT_ID` from env
- Accepts `redirect_uri` from the client
- Returns the Microsoft authorization URL:
  ```
  https://login.microsoftonline.com/common/oauth2/v2.0/authorize
    ?client_id=...
    &response_type=code
    &redirect_uri=...
    &scope=Team.ReadBasic.All Channel.ReadBasic.All ChannelMessage.Send offline_access
  ```

### 2. New Edge Function: `teams-oauth-callback`
Exchanges the authorization code for access + refresh tokens.

- Receives `code` and `redirect_uri` from the client
- Exchanges code at `https://login.microsoftonline.com/common/oauth2/v2.0/token`
- Stores `access_token`, `refresh_token`, and `expires_at` in the `teams_integrations` table
- Returns success with the user's display name

### 3. New Edge Function: `get-teams-channels`
Lists the user's Teams and their channels via Microsoft Graph API.

- Reads the stored access token for the company from `teams_integrations`
- Calls `GET https://graph.microsoft.com/v1.0/me/joinedTeams` to list teams
- For each team (or a selected team), calls `GET https://graph.microsoft.com/v1.0/teams/{team-id}/channels` to list channels
- Handles token refresh if expired
- Returns structured list of teams and channels

### 4. Update Edge Function: `send-teams-notification`
Replace the webhook-based sending with Microsoft Graph API message posting.

- Instead of posting to a webhook URL, use:
  ```
  POST https://graph.microsoft.com/v1.0/teams/{team-id}/channels/{channel-id}/messages
  ```
- Send rich content as HTML or Adaptive Cards
- Handle token refresh when expired

### 5. Database Changes: `teams_integrations` table
Add new columns to support OAuth tokens (and keep webhook_url for backward compatibility during migration):

| Column | Type | Purpose |
|--------|------|---------|
| `access_token` | text (nullable) | Microsoft Graph access token |
| `refresh_token` | text (nullable) | For refreshing expired tokens |
| `token_expires_at` | timestamptz (nullable) | When the access token expires |
| `team_id` | text (nullable) | Selected Microsoft Team ID |
| `team_name` | text (nullable) | Selected Microsoft Team display name |
| `channel_id` | text (nullable) | Selected channel ID |
| `auth_type` | text (default 'webhook') | 'oauth' or 'webhook' to support both |

### 6. New Hook: Update `useTeamsIntegration`
Refactor the hook to support both connection methods:

- Add `connectViaOAuth()` — initiates the browser redirect flow
- Add `handleOAuthCallback()` — processes the auth code on return
- Add `fetchTeamsAndChannels()` — queries the new edge function
- Add `selectTeamAndChannel()` — saves the selected team/channel
- Keep existing webhook flow as a fallback option

### 7. Update UI: `TeamsNotificationsCard`
Redesign the connection UI to match the Slack card pattern:

**Not Connected State:**
- Primary: "Connect to Microsoft Teams" button (OAuth flow)
- Secondary/collapsible: "Or connect via Webhook URL" (legacy option)

**Connected State (OAuth):**
- Show connected Microsoft account info
- Team dropdown (populated from Graph API)
- Channel dropdown (populated based on selected team)
- Notification toggles (same as current)
- Test / Disconnect buttons

**Connected State (Webhook - legacy):**
- Same as current UI

### 8. Token Refresh Utility
Create a shared utility in `supabase/functions/_shared/teams-auth.ts`:

- `getValidAccessToken(supabase, companyId)` — checks expiry, refreshes if needed
- `refreshAccessToken(refreshToken)` — calls Microsoft token endpoint
- Used by both `get-teams-channels` and `send-teams-notification`

---

## Architecture Flow

```text
User clicks "Connect to Microsoft Teams"
    |
    v
Frontend calls teams-oauth-url edge function
    |
    v
Browser redirects to Microsoft login page
    |
    v
User signs in and consents to permissions
    |
    v
Microsoft redirects back to app with auth code
    |
    v
Frontend sends code to teams-oauth-callback edge function
    |
    v
Edge function exchanges code for tokens, stores in DB
    |
    v
Frontend fetches teams/channels via get-teams-channels
    |
    v
User selects Team + Channel from dropdowns
    |
    v
Notifications sent via Graph API (not webhooks)
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/teams-oauth-url/index.ts` | Generate Microsoft OAuth URL |
| `supabase/functions/teams-oauth-callback/index.ts` | Exchange code for tokens |
| `supabase/functions/get-teams-channels/index.ts` | List teams and channels via Graph API |
| `supabase/functions/_shared/teams-auth.ts` | Token refresh utility |

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/send-teams-notification/index.ts` | Support Graph API sending alongside webhooks |
| `src/hooks/useTeamsIntegration.ts` | Add OAuth flow, team/channel fetching |
| `src/components/settings/TeamsNotificationsCard.tsx` | New OAuth connect UI with team/channel picker |

## Database Migration

- Add columns to `teams_integrations`: `access_token`, `refresh_token`, `token_expires_at`, `team_id`, `team_name`, `channel_id`, `auth_type`

---

## Important Notes

- The `MS_TEAMS_CLIENT_ID` and `MS_TEAMS_CLIENT_SECRET` must be added as Supabase secrets after registering the Azure AD app
- The `offline_access` scope is required to receive refresh tokens
- Access tokens expire after ~1 hour; the refresh utility handles this automatically
- Existing webhook-based connections will continue to work (backward compatible via `auth_type` column)
- The `scope=common` tenant allows any Microsoft work/school account to connect

