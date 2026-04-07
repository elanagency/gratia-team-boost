

## New Leaderboard Page

### Where it sits
The page will be a new route under the dashboard: **`/dashboard/leaderboard`**. A "Leaderboard" nav item will be added to the sidebar between "Analytics" and "Redeem Points" (visible to all users). It renders inside `UnifiedDashboardLayout` like the other dashboard pages, using the full content width (no right panel, same as Analytics/Settings).

### Matching the design exactly
The uploaded screenshot shows a very specific layout. Here is what I will replicate:

1. **Two-column layout**: A narrow left column with month filters, and a wide right column with the leaderboard table
2. **Month filter sidebar**: Vertical list of months (e.g. "March 2026", "February 2026", etc.) with the active month highlighted in purple with white text
3. **Top performer hero card**: At the top of the right column — shows the #1 ranked person with their avatar (large circle), name, department + role, and point total in green
4. **Leaderboard table**: Columns for Rank, Name (with avatar, name, and subtitle), Department, and Points. Alternating or clean row styling. Rank numbers left-aligned, points right-aligned

### Technical plan

**New files:**
- `src/pages/admin/Leaderboard.tsx` — the full page component

**Modified files:**
- `src/App.tsx` — add route `<Route path="leaderboard" element={<Leaderboard />} />`
- `src/components/dashboard/DashboardSidebar.tsx` — add "Leaderboard" nav item (visible to all users, using a Trophy or similar icon)

### Page component structure (`Leaderboard.tsx`)
- Fetches all active profiles and their point transactions (reusing the same logic from `LeaderboardCard` and `MonthlyLeaderboardCard`)
- Adds a **month filter** — generates last 6 months, filters transactions by selected month
- **Left column** (~160px fixed): month buttons styled to match the screenshot (purple active state, rounded pills)
- **Right column**: 
  - **Hero card** at top: large avatar, name, department, points (green text) for rank #1
  - **Table** below: Rank | Avatar+Name+Role | Department | Points columns
- Uses the existing design tokens: `rounded-[13.375px]`, `border-[#E8E6F0]`, Inter font, colors `#0F0533`, `#9996AA`, `#7F2BFE`
- Avatar colors cycle through the same palette used in `LeaderboardCard`

### Files to create/modify
1. **Create** `src/pages/admin/Leaderboard.tsx`
2. **Edit** `src/App.tsx` — add leaderboard route
3. **Edit** `src/components/dashboard/DashboardSidebar.tsx` — add nav item

