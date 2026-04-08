

# Consolidate Celebrations into Single Container with Collapsible Sections

## Problem
"Upcoming this month" and "Recently sent" are separate bordered cards. The Figma shows them as collapsible accordion rows inside the same container as the main config, separated by simple dividers.

## Design from Figma
- Single container with border wraps everything: config area, "Upcoming this month", "Recently sent", and the billing footnote
- "Upcoming this month" is a clickable row with a chevron that expands to show a table (Employee, Event, Date, Charge columns)
- "Recently sent" is the same — clickable row with chevron, expands to show a table (Employee, Event, Date, Amount sent columns)
- Both sections separated by a thin `1px solid #E8E6F0` divider
- Table header text: 12px, weight 400, color `#9996AA`, line-height 18px
- Table body text: 14px, weight 400, color `#0F0533`, line-height 21px
- Charge column for upcoming shows `$0.00` (not yet billed)
- Amount sent column for recently sent shows the dollar value
- Billing footnote sits at the bottom inside the same container

## Changes

### `src/components/settings/CelebrationSettingsCard.tsx`
1. Merge the three separate bordered containers into one single container
2. After the Save button + wallet section, add a divider line
3. Replace the "Upcoming this month" card with a collapsible section header row (title left, chevron right) — uses local state `upcomingOpen` toggle
4. When open, render a table with columns: Employee, Event, Date, Charge
5. Query upcoming celebrations: fetch profiles with birthdays or anniversaries in the current month that haven't been processed yet
6. Add another divider, then "Recently sent" as a collapsible section (state `recentOpen`)
7. When open, render a table with columns: Employee, Event, Date, Amount sent — pulling from `celebration_rewards_log` for current + previous month
8. Below both sections, render the billing footnote text with the Billing link
9. Use `ChevronDown` / `ChevronUp` from lucide-react for the toggle icon

### Data queries
- **Upcoming this month**: query `profiles` where `company_id` matches, filter in JS for birthday month/day or anniversary month/day matching current month, exclude already-rewarded (cross-check `celebration_rewards_log` for current year)
- **Recently sent**: modify existing `recentLogs` query to filter for current month and previous month instead of just `limit(50)`

### Files modified
- `src/components/settings/CelebrationSettingsCard.tsx`

