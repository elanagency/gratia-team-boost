

# Analytics Page: Remove Toggle, Department Filter, Compact Date Picker

## Changes

### 1. `src/pages/admin/Analytics.tsx`
- Remove the chart/table view mode toggle (the two icon buttons) and the `viewMode` state.
- Remove the `<AnalyticsDataTable>` rendering branch — always show `<AnalyticsAllCharts>`.
- Add a new `departmentFilter` state (string, default `"all"`) and pass it to `useAnalyticsData` queries via a new `departmentFilter` parameter (existing `segmentBy` stays `"none"` so charts render as a single series).
- Pass `departmentFilter` and `onDepartmentFilterChange` down to `AnalyticsFilters` instead of `segmentBy`/`onSegmentChange`.

### 2. `src/components/analytics/AnalyticsFilters.tsx`
- Replace the `segmentBy` props with `departmentFilter` / `onDepartmentFilterChange`.
- Use `useDepartments()` to load company departments and render them as `<SelectItem>`s. First option is `"All Departments"` (value `"all"`); then one item per department name.
- **Custom date picker**: shrink the left-hand presets column so it only hugs the text. Remove the `border-r` width-stretching by using `w-auto` on the inner container, and switch the preset buttons from `w-full` to inline (`whitespace-nowrap`, no `w-full`). Wrap the column in a tight `flex-col` with `min-w-0` and small horizontal padding (e.g. `px-2`). Keep the subtle separator with a thin `border-r` between columns.

### 3. `src/hooks/useAnalyticsData.ts`
- Add an optional `departmentFilter?: string` parameter to `UseAnalyticsDataParams` and thread it into each `fetch*Data` function.
- In the SQL queries (`fetchTransactionData`, `fetchEngagementData`, `fetchRedemptionsData`, `fetchLoginsData` and their `*Total` previous-period helpers), when `departmentFilter` is set and not `"all"`, filter results to profiles whose department name matches. Simplest approach: resolve the department name → `department_id` once via a lookup query, then add `.eq('profiles.department_id', id)` (or filter in-memory after fetch where the join is awkward, e.g. for redemptions where we already build a `profilesMap`).
- Include `departmentFilter` in the React Query `queryKey` so changes refetch.

### 4. Cleanup
- `AnalyticsDataTable.tsx` is no longer rendered from the analytics page; leave the file in place (no dead-import errors) but remove its import from `Analytics.tsx`.
- The unused `BarChart3` / `Table2` icon imports and `cn` (if no longer needed) get removed from `Analytics.tsx`.

## Files modified
- `src/pages/admin/Analytics.tsx`
- `src/components/analytics/AnalyticsFilters.tsx`
- `src/hooks/useAnalyticsData.ts`

