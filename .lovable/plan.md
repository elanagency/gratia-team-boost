

## Show Already-Linked Users on Load

### Problem
The "Already linked" list only appears after clicking "Auto-Link Users" because it's populated from the edge function response, which is stored in local state (`result`). On initial load, `result` is `null` so nothing shows.

### Solution
Add a query that fetches already-linked profiles on component mount by querying `profiles` where `slack_user_id IS NOT NULL` and `status = 'active'` for the company. Display this list immediately. When "Auto-Link Users" is clicked, merge/replace with the full result from the edge function.

### Changes

| File | Change |
|------|--------|
| `src/components/settings/SlackUserLinking.tsx` | Add a `useQuery` to fetch profiles with non-null `slack_user_id` for the company. Render the "Already linked" section from this query data by default. After auto-link runs, overlay with the richer result from the edge function. |

### Detail

- New query: `SELECT id, first_name, last_name, slack_user_id FROM profiles WHERE company_id = X AND status = 'active' AND slack_user_id IS NOT NULL`
- We don't have Slack display names in the profiles table, so the "Already linked" list will show the profile name on both sides (or just the profile name) until auto-link is run, which returns Slack names from the API.
- Alternative: Also fetch Slack workspace members to get display names. But that requires an extra edge function call on load. Simpler approach: just show the profile names with a note that Slack names load after auto-link.
- The "Auto-Link Users" button remains for discovering new matches and showing Slack display names.

