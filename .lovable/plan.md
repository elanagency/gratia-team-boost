

# Add Segmentation Support to Engagement Rate

## What This Changes

Currently, the Engagement Rate metric calculates a single company-wide percentage. This update will add support for breaking it down by **department** or by **person**, so the segment filter works just like it does for other metrics.

- **By Department**: Shows the engagement rate for each department individually (e.g., "Engineering: 75%, Marketing: 50%"), calculated as the percentage of that department's members who participated.
- **By Person**: Shows which individuals participated (value = 1 for participated, 0 for not) -- effectively a participation indicator per person.

## Technical Details

### 1. `src/hooks/useAnalyticsData.ts`

**Update `fetchEngagementDataWithTrend`** to accept and pass `segmentBy`:
- Add `segmentBy` parameter to the function signature
- Pass it through to `fetchEngagementData`

**Update `fetchEngagementData`** to support segmentation:
- Add `segmentBy` parameter
- Expand the profiles query to include `department_id, departments(name), first_name, last_name`
- Expand the transactions query to include `sender_profile_id, recipient_profile_id` (already there)
- **When `segmentBy === 'department'`**: Group members by department, calculate engagement rate per department per interval, and populate `segments` on each chart data point
- **When `segmentBy === 'person'`**: For each interval, show each person's participation status (participated = 100, not = 0) or count of unique interactions
- **When `segmentBy === 'none'`**: Keep current behavior (company-wide rate)
- Update table data to use `buildTableData` helper with segments

**Update the switch statement** (line 82) to pass `segmentBy` to `fetchEngagementDataWithTrend`.

### 2. `src/pages/admin/Analytics.tsx`

- Remove the `isSegmentDisabled` logic and the `useEffect` that resets segmentBy
- Remove the `disableSegment` prop from `AnalyticsFilters`

### 3. `src/components/analytics/AnalyticsFilters.tsx`

- Remove the `disableSegment` prop and related disabled/title logic on the Select component
- The segment dropdown will always be enabled

## Behavior

- Selecting "Department" with Engagement Rate shows each department's engagement rate per time interval
- Selecting "Person" shows individual participation per interval
- The chart will show multi-series data (one line/area per segment), consistent with how other metrics display segments
- Table data will show one row per segment per date, matching the existing pattern

