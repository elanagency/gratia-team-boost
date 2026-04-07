

## Right-Side Fixed Panel Layout

### Overview
Restructure the dashboard so the right column (PersonalStatsCard, Leaderboard, Celebrations) acts as a fixed/sticky sidebar pinned to the right edge, separated by a full-height vertical border (#E8E6F0). The middle column scrolls independently. The onboarding checklist moves into the middle column.

### Architecture Change

The current approach puts everything inside a single grid in `Dashboard.tsx` within a scrollable `<main>`. Instead:

1. **UnifiedDashboardLayout.tsx** — Split `<main>` into two sections:
   - A scrollable center area (flex-1, overflow-y-auto)
   - A fixed right panel (fixed width ~300px, full height, border-left #E8E6F0, overflow-y-auto)

2. **Dashboard.tsx** — Remove the 3-column grid entirely. The middle column content (onboarding, composer, feed) renders as a single column. The right panel widgets move up to the layout level or are rendered via a portal/context.

### Detailed Plan

#### 1. Modify `UnifiedDashboardLayout.tsx`
- Change the `<main>` area from a single scrollable container to a flex row with two children:
  - **Center content area**: `flex-1 overflow-y-auto` with the existing padding (`lg:px-[145px] lg:pt-[72px]`). This renders `<Outlet />`.
  - **Right panel**: Fixed-width (`w-[300px] min-w-[300px]`), `h-screen sticky top-0`, with `border-l` using color `#E8E6F0`, `overflow-y-auto`, padding `p-6 pt-[72px]`. This renders the right-side widgets directly.
- Import and render `PersonalStatsCard`, `LeaderboardCard`, `UpcomingCelebrations` in the right panel.
- Use border color `border-[#E8E6F0]` consistently.
- On mobile (below `lg`), hide the right panel or stack it below.

#### 2. Simplify `Dashboard.tsx`
- Remove the 3-column grid layout entirely.
- Remove imports for `PersonalStatsCard`, `LeaderboardCard`, `UpcomingCelebrations` (they move to the layout).
- Render only: dialogs, onboarding checklist, `GivePointsCard`, `RecognitionFeed` — all as a single column with `space-y-6`.

#### 3. Border color consistency
- Replace all `border-border` references on the dashboard page with `border-[#E8E6F0]`.
- This applies to the right panel separator and any card borders on the page.

### Files to modify
1. **`src/pages/dashboard/UnifiedDashboardLayout.tsx`** — add right panel with widgets, split main into center + right
2. **`src/pages/admin/Dashboard.tsx`** — simplify to single column, remove right-side widgets

