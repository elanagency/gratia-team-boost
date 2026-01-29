

# Add Month-over-Month Comparison and Segment Visualization

## Overview
Enhance the Analytics tab with two key features:
1. **Month-over-month trend** - Calculate and display percentage change from the previous period
2. **Segment visualization** - Show department or person breakdowns in both the chart and data table

---

## Current State

| Feature | Status | Notes |
|---------|--------|-------|
| Segment dropdown | Exists | "By Department" / "By Person" options in filters |
| Segment data collection | Exists | `segments` property populated in data hook |
| Segment visualization | Missing | Chart/table only show totals, not breakdowns |
| Trend field | Exists | Always returns `0`, never calculated |
| Trend display | Missing | No UI to show MoM change |

---

## What You'll Get

### Month-over-Month Trend
- Calculates percentage change by comparing current period to the same-length previous period
- Displays with up/down arrow and color coding (green for positive, red for negative)
- Shown next to Total and Average in the chart header

### Segment Visualization
- **Chart**: Multiple colored lines/areas when segmented (one per department or person)
- **Table**: Rows grouped by segment with individual breakdowns
- **Legend**: Shows which color represents which segment

---

## Implementation Details

### 1. Calculate Month-over-Month Trend

**File:** `src/hooks/useAnalyticsData.ts`

Add a helper function to fetch previous period data and calculate percentage change:

```typescript
function calculateTrend(
  currentTotal: number,
  previousTotal: number
): number {
  if (previousTotal === 0) return currentTotal > 0 ? 100 : 0;
  return Math.round(((currentTotal - previousTotal) / previousTotal) * 100);
}
```

For each metric fetch function, also query the previous period:
- If current range is Jan 1-31, previous range would be Dec 1-31
- Calculate previous period total
- Return trend as percentage change

### 2. Display Trend in Chart Header

**File:** `src/components/analytics/AnalyticsChartArea.tsx`

Update the header to show the trend:

```text
+----------------------------------------------------------------+
| Recognition Received                                           |
|                          Total: 1,234 pts | Avg: 82 pts | +12% |
+----------------------------------------------------------------+
```

- Add `trend` prop
- Show with `TrendingUp` or `TrendingDown` icon from lucide-react
- Color: green for positive, red for negative, gray for zero

### 3. Visualize Segments in Chart

**File:** `src/components/analytics/AnalyticsChartArea.tsx`

When segments exist in the data:
- Transform data to have one key per segment
- Render multiple `<Area>` components with different colors
- Add a legend showing segment names and colors
- Use a color palette that contrasts well

```typescript
// Example transformed data for chart
[
  { date: "Jan 1", "Engineering": 50, "Sales": 30, "Marketing": 20 },
  { date: "Jan 2", "Engineering": 45, "Sales": 35, "Marketing": 25 },
]
```

### 4. Show Segments in Data Table

**File:** `src/components/analytics/AnalyticsDataTable.tsx`

When segmented, update the table to show:
- Add "Segment" column
- Flatten data so each segment appears as its own row
- Or group rows by date with expandable segment details

**Option A - Flat table:**
| Date | Segment | Value | vs Avg |
|------|---------|-------|--------|
| Jan 1 | Engineering | 50 pts | +12% |
| Jan 1 | Sales | 30 pts | -5% |

**Option B - Grouped (cleaner for many segments):**
Use collapsible rows with date as header and segments as children.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useAnalyticsData.ts` | Calculate trend by fetching previous period; ensure all metrics populate segments |
| `src/components/analytics/AnalyticsChartArea.tsx` | Display trend; render multi-line chart when segmented; add legend |
| `src/components/analytics/AnalyticsDataTable.tsx` | Add segment column; flatten or group data by segment |
| `src/pages/admin/Analytics.tsx` | Pass `trend` and `segmentBy` to chart component |

---

## Technical Details

### Trend Calculation Logic

```typescript
// In useAnalyticsData.ts
async function fetchWithTrend(
  companyId: string,
  startDate: Date,
  endDate: Date,
  ...otherParams
) {
  // Calculate previous period dates
  const periodLength = endDate.getTime() - startDate.getTime();
  const prevEndDate = new Date(startDate.getTime() - 1); // Day before current start
  const prevStartDate = new Date(prevEndDate.getTime() - periodLength);

  // Fetch both periods
  const [currentData, previousData] = await Promise.all([
    fetchMetricData(companyId, startDate, endDate, ...),
    fetchMetricData(companyId, prevStartDate, prevEndDate, ...),
  ]);

  // Calculate trend
  const trend = calculateTrend(currentData.total, previousData.total);

  return { ...currentData, trend };
}
```

### Multi-Series Chart Data

Transform segment data for Recharts:

```typescript
// Transform from:
{ date: "Jan 1", value: 100, segments: { "Eng": 50, "Sales": 30, "Mktg": 20 } }

// To:
{ date: "Jan 1", "Engineering": 50, "Sales": 30, "Marketing": 20 }
```

Render with dynamic Area components:

```tsx
{segmentKeys.map((key, index) => (
  <Area
    key={key}
    type="monotone"
    dataKey={key}
    stroke={COLORS[index % COLORS.length]}
    fill={`url(#gradient-${index})`}
  />
))}
```

### Color Palette for Segments

```typescript
const SEGMENT_COLORS = [
  "#F572FF", // Primary accent (pink)
  "#6366F1", // Indigo
  "#22C55E", // Green
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#06B6D4", // Cyan
  "#8B5CF6", // Purple
  "#EC4899", // Pink variant
];
```

---

## Edge Cases

- **No previous period data**: Show "N/A" or "--" for trend
- **Too many segments (>8)**: Consider showing top 8 with "Other" combined
- **Empty segments**: Filter out segments with zero values
- **Engagement rate segmentation**: Not applicable (aggregate metric) - hide segment filter for this metric

---

## Implementation Order

1. **Add trend calculation** to `useAnalyticsData.ts` - Fetch previous period, calculate percentage
2. **Display trend** in `AnalyticsChartArea.tsx` - Add arrow icon and colored badge
3. **Multi-series chart** - Transform data and render multiple Areas with legend
4. **Segmented table** - Update table to show segment breakdowns
5. **Polish** - Handle edge cases, limit segment count, style refinements

