

# Fix: Teams Channel Selection Not Persisting on Page Load

## Problem

When the page loads, two `useEffect` hooks race against each other:

1. **Pre-populate effect** (line 71-74): Sets `selectedTeamId` and `selectedChannelId` from the saved integration
2. **Channel-fetch effect** (line 77-86): Fires when `selectedTeamId` changes, and always resets `selectedChannelId` to `''` and clears the channels list

The channel-fetch effect runs after the pre-populate sets the team ID, wiping out the saved channel selection. So on every page load, the channel dropdown shows "Select channel" even though it is saved in the database.

## Fix

**File: `src/components/settings/TeamsNotificationsCard.tsx`**

1. Only reset `selectedChannelId` in the channel-fetch effect when the user is **actively changing** the team (i.e., the new team ID differs from the saved `integration.team_id`). When the team ID matches what is already saved, preserve the existing `selectedChannelId`.

2. After fetching channels, if the saved `integration.channel_id` matches one of the fetched channels, re-select it automatically.

This ensures that on initial load the saved channel is preserved, while still clearing the channel when the user picks a different team.

## Technical Detail

Replace the channel-fetch `useEffect` (lines 77-86) with logic that:
- Skips resetting `selectedChannelId` if `selectedTeamId === integration?.team_id`
- After channels are fetched, if the integration's saved `channel_id` exists in the fetched list, sets it as selected

