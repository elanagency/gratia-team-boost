

# Analytics Table Units and Settings Icon

## 1. Remove "pts" from table cells, add to row label

Currently every cell shows values like "0 pts", "20 pts". The change removes the unit suffix from individual cells and appends it to the row label instead (e.g., "Total (pts)").

### File: `src/components/analytics/AnalyticsDataTable.tsx`

- Change the `metricUnits` map to only be used for row labels, not cell values
- In the table body, remove `{unit}` from the cell rendering (line 154), so cells show just the number
- Append the unit to the row label: e.g., `Total (pts)` instead of `Total` -- but only when the unit is non-empty
- The header columns (dates) and CSV export remain unchanged

## 2. Add Settings icon to the top navigation bar

Currently Settings is only inside the user dropdown. The request is to add a visible Settings gear icon next to the user avatar area in the top-right, outside the dropdown.

### File: `src/components/dashboard/DashboardTopNavigation.tsx`

- Add a `Link` with a `Settings` icon (already imported) directly before the `DropdownMenu` in the user menu area (line 89-90)
- Only render this icon when `isAdmin` is true (non-admins don't have settings access)
- Style: white icon with subtle hover background (`hover:bg-white/10`), matching the nav style

