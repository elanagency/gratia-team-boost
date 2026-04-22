

# Dashboard Feedback — Plans for Confidently Understood Items

I've split the 9 items into **(A) Plans I'm confident about** and **(B) Items I need more details on**.

---

## A. Plans I'll implement

### 1. "View all" on leaderboard → 404
**File:** `src/components/points/LeaderboardCard.tsx` (line 138)
Change `navigate("/leaderboard")` to `navigate("/dashboard/leaderboard")`. The leaderboard route is nested under `/dashboard` in `App.tsx`, so the bare `/leaderboard` falls through to `NotFound`.

### 2. Profile picture not carrying over to leaderboard / teams page
**Files:** `src/components/points/LeaderboardCard.tsx`, `src/pages/admin/Leaderboard.tsx`, and the team members table component.
Currently these queries select only `first_name, last_name, department` (and `role`) from `profiles` and render `<AvatarFallback>` with initials only — no `<AvatarImage>`. The `PersonalStatsCard` and `RecognitionFeed` already pull `avatar_url` and render it.
Fix: include `avatar_url` in the `profiles` `select(...)`, plumb it through the row type, and render `<AvatarImage src={avatarUrl} />` alongside the existing `<AvatarFallback>` in:
- Dashboard leaderboard widget (`LeaderboardCard.tsx`)
- Full leaderboard page (`Leaderboard.tsx`)
- Team members list (`src/components/dashboard/TeamMembers.tsx` and/or `TeamMemberTable.tsx`)

### 3. "Points on card should match points on redeem page"
The dashboard `PersonalStatsCard` shows `totalPoints` from `useAuth()` (= **redeemable** points). The redeem page (`GiftCardModal` "Available Points" pill) also reads from auth. They should already pull from the same source.
Fix: audit both surfaces and make them both read the same `totalPoints` (a.k.a. redeemable points) value from `useAuth()`. If the dashboard card is currently labeled "Points" but actually shows monthly points (or vice versa), align the source so the number on the personal stats card == the number shown in the redemption modal's "Available Points" pill.
**Files:** `src/components/dashboard/PersonalStatsCard.tsx`, `src/components/team/GiftCardModal.tsx`. Verify both call `useAuth().totalPoints` and label it consistently.

### 4. "Adding new company value should not be available in the dropdown"
**File:** `src/components/points/GivePointsCard.tsx` (lines 570–578)
Remove the "+ Add new value" button (and its associated `isAddingValue` state / inline form, lines 529–578) from the **Company value** popover in the recognition composer. Adding new values should only be possible via the dedicated values management UI (Settings → Company Values), not inline from the composer.

### 5. Quick points feature not working
**File:** `src/components/points/RecognitionFeed.tsx`
The `+1 / +5 / +10` quick-points uses `useOptimisticMutation` calling `transfer_points_between_users` RPC, then writes the comment as `Quick appreciation: <originalDescription>`. I'd need to reproduce this in the preview to see the exact failure (toast error? no UI update? RPC error?).
Plan: I'll click a quick-point button in the preview, capture the console + network response, identify the failure (likely RPC parameter mismatch, the description being too long for thread matching, or `originalDescription` being HTML), and fix accordingly. If the failure is "no thread groups the comment" I'll switch from text-similarity matching to passing a `parent_transaction_id` or simpler approach.
Note: this is the only item where I'll need to actually run the dashboard to confirm root cause — I'll reproduce, fix, then verify.

---

## B. Items I need more details on

### 6. "Ensure user stats on right are all time and agree to database. Currently not matching up."
The `PersonalStatsCard` shows three numbers: **Points** (`totalPoints` from auth), **Received** (count of all `point_transactions` where `recipient_profile_id = me`), **Sent** (count of all where `sender_profile_id = me`).
**What I need:** which number is wrong, and what should it show?
- Should "Received" / "Sent" be **counts of transactions** (current behavior) or **sum of points**?
- Should they exclude system/redemption/self transactions like the recognition feed does? (Currently they include everything.)
- "All time" — they already are all-time (no date filter). What value are you comparing against in the DB to say it doesn't match?

### 7. "Upload picture o[r/n] recognition not available"
Two possible meanings:
- (a) The image-upload icon in the recognition composer currently shows a toast "Image attachments coming soon!" (line 657) — i.e. it's not implemented. Do you want us to **build** image attachments now, or **hide** the icon until it's ready?
- (b) Or do you mean profile-picture upload doesn't work for some users (e.g. permissions/storage error)?

Which one?

### 8. "Drop downs on give recognition section are not same as Figma UI"
The composer has 3 pill dropdowns: **Select teammate**, **Company value**, and **points** (e.g. "100 pts"). I don't have the Figma reference for the dropdown panels themselves.
**What I need:** screenshots of the Figma dropdown panels (the open state — teammate list, value chooser, points chooser) so I can match colors, padding, item layout, etc.

---

Ready to start on items 1–5 once you confirm. For 6–8 I just need the clarifications above.

