

## Dashboard Layout Redesign to Match Figma

Based on the Figma screenshots, the dashboard needs these changes:

### 1. White background (UnifiedDashboardLayout)
**File: `src/pages/dashboard/UnifiedDashboardLayout.tsx`**
- Change `bg-muted` to `bg-white` on the outer `div`

### 2. Remove "Dashboard" title, restructure layout (Dashboard.tsx)
**File: `src/pages/admin/Dashboard.tsx`**
- Remove the `<h1>Dashboard</h1>` header block entirely
- Move `GivePointsCard` into the left column (above RecognitionFeed) instead of full-width
- Keep the two-column grid (`lg:grid-cols-3`) with recognition composer + feed in left 2/3 and widgets in right 1/3
- Right column order stays: PersonalStatsCard → LeaderboardCard → UpcomingCelebrations

### 3. Add rounded gray border to GivePointsCard
**File: `src/components/points/GivePointsCard.tsx`**
- The Figma shows the recognition composer with a visible rounded gray border (like `border border-[#E8E6F0] rounded-xl`)
- Update the Card className to include explicit border styling matching the Figma (`border border-gray-200 rounded-xl shadow-none`)

### 4. PersonalStatsCard border styling
**File: `src/components/dashboard/PersonalStatsCard.tsx`**
- Match the Figma: card with rounded border, background gradient (`linear-gradient(135deg, #7F2BFE 6%, #FC5BFF 6%)` subtle tint), border color `#E8E6F0`
- Update card to have `border border-[#E8E6F0] rounded-xl shadow-none`

### Summary of visual changes
- Background: gray → white
- No "Dashboard" heading
- Recognition composer moves into the left column (not full-width)
- All cards get consistent rounded gray borders with no shadow
- Two-column layout: left = composer + feed, right = stats + leaderboard + celebrations

