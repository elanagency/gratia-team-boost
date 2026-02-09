

# Fix: Microsoft Teams OAuth Callback Conflict + Invalid Secret

## Two Problems Found

### Problem 1: Slack hook hijacks the Teams OAuth code
Both the Slack card (`SlackNotificationsCard.tsx`, line 41) and Teams hook (`useTeamsIntegration.ts`, line 83) detect `?code=` in the URL on the settings page. When Microsoft redirects back with an auth code, the **Slack** component also tries to process it as a Slack code, fails, and shows: *"Failed to connect Slack: Edge Function returned a non-2xx status code."*

### Problem 2: Invalid Azure Client Secret
The edge function logs show: `AADSTS7000215: Invalid client secret provided. Ensure the secret being sent in the request is the client secret value, not the client secret ID.`

You need to update the `MS_TEAMS_CLIENT_SECRET` Supabase secret with the actual **Secret Value** (not the Secret ID) from Azure. The secret value is only shown once when you create it -- if you can't find it, you'll need to create a new client secret in Azure.

---

## Fix Plan

### 1. Differentiate OAuth callbacks (prevent collision)

**Option: Use a `state` parameter to distinguish providers**

**File: `src/hooks/useTeamsIntegration.ts`**
- When generating the OAuth URL, include `state=teams` in the request
- In the callback detection `useEffect`, only process the code if `state=teams` is present in the URL params

**File: `supabase/functions/teams-oauth-url/index.ts`**
- Add `state=teams` to the authorization URL query parameters

**File: `src/components/settings/SlackNotificationsCard.tsx`**
- In the callback `useEffect`, skip processing if `state=teams` is present in the URL (meaning it's a Teams callback, not Slack)

### 2. Update the MS_TEAMS_CLIENT_SECRET (manual step)

Go to Azure Portal > App registrations > your app > Certificates & secrets, create a new client secret, copy the **Value** (not the ID), and update the `MS_TEAMS_CLIENT_SECRET` Supabase secret.

---

## Technical Details

**Files to modify:**
| File | Change |
|------|--------|
| `supabase/functions/teams-oauth-url/index.ts` | Add `state=teams` to auth URL |
| `src/hooks/useTeamsIntegration.ts` | Check for `state=teams` before processing callback |
| `src/components/settings/SlackNotificationsCard.tsx` | Skip callback if `state=teams` is present |

