

# Always Show Celebration Summary & History

## Problem

The "Celebration Summary" and "Celebration Rewards History" cards are hidden when there's no data, so admins can't see them at all until rewards start being distributed.

## Changes

**File: `src/components/settings/CelebrationSettingsCard.tsx`**

1. **Yearly Summary Stats (line 362)**: Remove the `yearlyStats && yearlyStats.total_points > 0` condition. Always render the card, defaulting stats to 0 when no data exists.

2. **Celebration Rewards History (line 393)**: Remove the `recentLogs && recentLogs.length > 0` condition. Always render the card, showing an empty state message ("No celebration rewards distributed yet") when there are no logs.

Both sections will always be visible on the Celebrations tab regardless of whether any rewards have been distributed.

