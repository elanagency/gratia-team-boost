

# Show Celebration Rewards in Recognition Feed + Dedicated Celebration Feed

## Overview

Two changes:
1. **Recognition Feed** -- Include birthday and anniversary celebration entries so the whole team can see them
2. **Celebrations tab** -- Add a dedicated, more detailed celebration rewards feed (expanding the existing recent logs table into a full history)

---

## 1. Recognition Feed: Show Celebration Entries

**File: `src/components/points/RecognitionFeed.tsx`**

Currently, the filter at lines 95-121 excludes all self-transactions (`sender_profile_id === recipient_profile_id`). Celebration rewards are recorded as self-transactions with descriptions starting with a cake or party emoji.

**Changes:**
- Update the filter to allow self-transactions through when the description matches celebration patterns (`/^🎂/` or `/^🎉/`)
- In the feed rendering (lines 508-623), detect celebration posts and render them differently:
  - Instead of "**SenderName** gave +50 to **RecipientName**", show something like "🎂 **Sarah Johnson** received +50 birthday celebration points" or "🎉 **John Smith** received +100 work anniversary points"
  - Use a distinct avatar background color (e.g., a warm celebratory tone) to visually distinguish celebrations from peer recognitions
  - Hide the "quick points" buttons on celebration posts since they are system-generated
- Celebration posts will not be grouped into threads (they stand alone)

## 2. Celebrations Tab: Dedicated Celebration Feed

**File: `src/components/settings/CelebrationSettingsCard.tsx`**

The existing "Recent Celebration Rewards" table (lines 333-364) already shows the last 10 entries. We will expand this into a full celebration feed:

- Increase the limit from 10 to 50 entries
- Add a "Load More" or pagination if needed
- Add summary stats at the top: total points distributed this year, number of birthday rewards, number of anniversary rewards
- Show the wallet deduction alongside each entry so admins can track spending

No new files are needed -- both changes modify existing components.

## Technical Details

### RecognitionFeed filter change (lines 95-121)

```
// Allow celebration self-transactions through
const celebrationPatterns = [/^🎂/, /^🎉/];
const isCelebration = celebrationPatterns.some(p => p.test(transaction.description));

if (transaction.sender_profile_id === transaction.recipient_profile_id && !isCelebration) {
  return false;
}
```

### RecognitionFeed rendering change

Add a helper to detect celebrations:
```
const isCelebrationPost = (t: PointTransaction) =>
  t.sender_id === t.recipient_id && (/^🎂/.test(t.description) || /^🎉/.test(t.description));
```

For celebration posts, render a different layout:
- Show the recipient's avatar with a celebration-themed background
- Display "received X celebration points" instead of the sender/recipient flow
- Show the description (e.g., "Birthday reward" / "Work anniversary reward")
- No quick-points buttons

### CelebrationSettingsCard expansion

- Add yearly summary stats query from `celebration_rewards_log` grouped by `reward_type`
- Increase log fetch limit to 50
- Show running total of points spent on celebrations

