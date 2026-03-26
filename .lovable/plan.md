

## Dashboard Redesign: Top Nav to Sidebar + New Layout

### Summary

Replace the current top navigation bar with a dark sidebar matching the Figma design, and restructure the dashboard page layout to a new 3-column arrangement: Give Recognition composer at top, Recognition Feed on the left, and a right sidebar with personal stats, leaderboard, and upcoming celebrations.

### Design Details (from Figma screenshots)

- **Sidebar background**: `#0F0533` (dark purple/blue) -- already defined as `--sidebar-background`
- **Give Recognition button**: gradient from `#7F2BFE` to `#FC5BFF`
- **Active nav item**: white text with 10% white background, rounded
- **Nav items**: Home, Analytics, Leaderboard, Redeem Points, Settings
- **Sidebar header**: Grattia logo, then company card (logo + name + member count)
- **Sidebar footer**: User avatar, name, role, Sign out
- **Right panel cards**: Personal stats card (Points, Received, Sent), Leaderboard (top 5), Upcoming Celebrations

### Files to Change

| File | Change |
|------|--------|
| `src/components/dashboard/DashboardSidebar.tsx` | **New file.** Dark sidebar with logo, company info, "Give Recognition" button, nav links, user footer. |
| `src/pages/dashboard/UnifiedDashboardLayout.tsx` | Replace `DashboardTopNavigation` with new `DashboardSidebar`. Change layout from vertical (top nav + content) to horizontal (sidebar + content). |
| `src/pages/admin/Dashboard.tsx` | Restructure layout: onboarding at top, then GivePointsCard spanning full width, then 2-column grid with RecognitionFeed (left, wider) and right sidebar (personal stats + leaderboard + celebrations). Remove old height-sync logic. |
| `src/components/dashboard/PersonalStatsCard.tsx` | **New file.** Shows logged-in user's total points, received count, sent count with avatar and role. |
| `src/components/dashboard/UpcomingCelebrations.tsx` | **New file.** Lists upcoming birthdays and work anniversaries from company profiles. |
| `src/components/dashboard/DashboardTopNavigation.tsx` | Keep file but it will no longer be used in the layout (can remove import). |

### Sidebar Structure

```text
+---------------------------+
|  ✦ grattia (logo)         |
+---------------------------+
|  [logo] Acme Corp         |
|         12 teammates      |
+---------------------------+
|  [ Give Recognition ]     |  <-- gradient button
+---------------------------+
|  🏠 Home          (active)|
|  📊 Analytics             |
|  🏆 Leaderboard           |
|  🎁 Redeem Points         |
|  ⚙️ Settings              |
+---------------------------+
|                           |
|  (spacer)                 |
|                           |
+---------------------------+
|  [avatar] Priya Sharma    |
|           Manager         |
|  ↪ Sign out               |
+---------------------------+
```

### Dashboard Content Layout

```text
+-----------------------------------------------+
| [Onboarding checklist - if incomplete]         |
+-----------------------------------------------+
| Points to give: 100                            |
| [Recognition composer - full width]            |
+------------------------+----------------------+
|                        | Personal Stats Card  |
| Recognition Feed       |----------------------|
| (scrollable)           | Leaderboard (top 5)  |
|                        |----------------------|
|                        | Upcoming Celebrations|
+------------------------+----------------------+
```

### Technical Notes

- The sidebar needs company name and member count: query `companies` table for name and `profiles` count for the company.
- Company logo comes from `companies.logo_url`.
- Upcoming celebrations: query `profiles` for `birthday` and `company_start_date` fields where dates are within the next 30 days.
- Personal stats (Points, Received, Sent): user's `points` from profile, plus aggregated `point_transactions` counts.
- Nav items differ for admin vs team member (admin sees Analytics + Settings, team member sees Redeem Points).
- The "Give Recognition" button in the sidebar opens the GivePointsDialog or scrolls to the composer.
- Mobile: sidebar collapses to a hamburger menu or off-canvas drawer.

