

# Change Celebration Feed Messages and Enable Quick Points

## Overview
Two changes based on client feedback:
1. Update how birthday and work anniversary messages display in the Recognition Feed
2. Allow users to give quick points on celebration entries (currently disabled)

## Changes

### 1. Update celebration message format in the edge function

**File: `supabase/functions/process-celebration-rewards/index.ts`**

Update the `point_transactions` descriptions to include the member's name and (for anniversaries) the years of service:

- Birthday: `🎂 Today is [First Name]'s Birthday!`
- Anniversary: `🎉 Today is [Full Name]'s [X] year work anniversary!`

This changes the `description` field in the `point_transactions.insert()` calls (lines ~188 and ~243).

### 2. Update the Recognition Feed display

**File: `src/components/points/RecognitionFeed.tsx`**

**a) Change celebration rendering (lines 537-551)**

Instead of the current generic "received +X birthday celebration points" format, display the transaction description directly since it will now contain the personalized message. Show it like:

```
🎂 Today is Pedro's Birthday!
[+100 badge]
```

or

```
🎉 Today is Pedro Olinger's 2 year work anniversary!
[+100 badge]
```

The description from the database will be the primary display text, with the points badge shown separately.

**b) Enable quick points on celebration entries (line 590)**

Remove the `!isCelebration` condition from line 590:

```
// Before:
{canGivePoints && !isCelebration && (

// After:
{canGivePoints && (
```

This allows any user (except the celebrant themselves) to give quick appreciation points on birthday and anniversary posts.

### 3. Update notification messages (same edge function)

Update the `sendCelebrationNotifications` calls to use the same personalized messages for Slack/Teams notifications, keeping consistency across the platform.

## Technical Details

- The `process-celebration-rewards` edge function already has access to `member.first_name`, `member.last_name`, and `yearsOfService` (for anniversaries) -- no new data needed
- The Recognition Feed already detects celebrations via the `🎂`/`🎉` prefix pattern -- this continues to work
- The edge function will need to be redeployed after changes
- Existing celebration entries in the database will keep their old format; only new ones will use the updated messages
