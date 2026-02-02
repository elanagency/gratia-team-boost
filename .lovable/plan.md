
# Horizontal Scrolling Analytics Data Table

## Overview
Redesign the analytics data table to match RevenueCat's layout with horizontal scrolling, fixed left columns, and simplified display (no average comparisons).

---

## Visual Transformation

**Before (vertical scroll):**
```
┌─────────────────────────────────────────────┐
│ Daily Breakdown                             │
├─────────┬─────────────┬─────────┬───────────┤
│ Date    │ Department  │ Value   │ vs Avg    │
├─────────┼─────────────┼─────────┼───────────┤
│ Jan 3   │ Sales       │ 20 pts  │ +15%      │
│ Jan 4   │ Sales       │ 18 pts  │ +10%      │
│ Jan 5   │ Marketing   │ 12 pts  │ -5%       │
│ ...vertical scrolling...                    │
└─────────────────────────────────────────────┘
```

**After (horizontal scroll, RevenueCat style):**
```
┌────────────────────────────────────────────────────────────────────────────────┐
│ ← FIXED COLUMNS →│← SCROLLABLE DATE COLUMNS →                                  │
├──────────────────┼──────────┬──────────┬──────────┬──────────┬──────────┬──────┤
│ Segments         │ Jan 20   │ Jan 21   │ Jan 22   │ Jan 23   │ Jan 24   │ ...  │
├──────────────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────┤
│ Total            │ 50 pts   │ 48 pts   │ 52 pts   │ 45 pts   │ 55 pts   │ ...  │
│ Sales            │ 25 pts   │ 22 pts   │ 28 pts   │ 20 pts   │ 30 pts   │ ...  │
│ Marketing        │ 15 pts   │ 16 pts   │ 14 pts   │ 15 pts   │ 15 pts   │ ...  │
│ Engineering      │ 10 pts   │ 10 pts   │ 10 pts   │ 10 pts   │ 10 pts   │ ...  │
└──────────────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────┘
                                          ← horizontal scroll →
```

---

## Changes Summary

| Aspect | Before | After |
|--------|--------|-------|
| Scroll direction | Vertical | Horizontal |
| Header row | Date, Segment, Value, vs Avg | Segment name + dates across |
| Left column | Date | Row labels (Total, segment names) |
| vs Avg column | Present | Removed |
| Card title | "Daily Breakdown" or "Breakdown by..." | None (removed) |
| Fixed columns | None | Left column stays fixed on scroll |

---

## Technical Details

**File:** `src/components/analytics/AnalyticsDataTable.tsx`

### 1. Transform data structure

The current data is organized as rows per date. We need to pivot it so that:
- Rows represent segments (or "Total" for non-segmented)
- Columns represent dates

```typescript
// Transform data for horizontal layout
interface PivotedData {
  dates: string[];  // Column headers
  rows: {
    label: string;  // Row label (e.g., "Total", "Sales", "Marketing")
    values: Record<string, number>;  // { "Jan 20": 50, "Jan 21": 48, ... }
  }[];
}
```

### 2. Implement sticky left column with CSS

Use CSS `sticky` positioning to keep the first column fixed:

```css
/* First column stays fixed */
th:first-child,
td:first-child {
  position: sticky;
  left: 0;
  z-index: 10;
  background: white; /* or bg-background for dark mode */
}
```

### 3. Horizontal scrolling container

Replace vertical scroll container with horizontal:

```tsx
<div className="overflow-x-auto">
  <table className="min-w-max">
    {/* Table content */}
  </table>
</div>
```

### 4. Remove unwanted elements

- Remove `CardHeader` with "Daily Breakdown" / "Breakdown by..." title
- Remove the "vs Avg" column entirely
- Remove average calculation logic for comparison

### 5. Update component props

The `average` prop can be removed as it's no longer needed for display.

---

## Implementation Approach

### Data Transformation Logic

```typescript
function pivotTableData(data: TableDataRow[], segmentBy: SegmentType) {
  // Get unique dates in order
  const dates = [...new Set(data.map(row => row.date))];
  
  if (segmentBy === 'none') {
    // Single "Total" row with values for each date
    const values: Record<string, number> = {};
    data.forEach(row => {
      values[row.date] = row.value;
    });
    return {
      dates,
      rows: [{ label: 'Total', values }]
    };
  }
  
  // Group by segment
  const segmentMap: Record<string, Record<string, number>> = {};
  const totals: Record<string, number> = {};
  
  data.forEach(row => {
    const segment = row.segmentName || 'Unknown';
    if (!segmentMap[segment]) segmentMap[segment] = {};
    segmentMap[segment][row.date] = row.value;
    totals[row.date] = (totals[row.date] || 0) + row.value;
  });
  
  // Build rows: Total first, then segments
  const rows = [
    { label: 'Total', values: totals },
    ...Object.entries(segmentMap).map(([label, values]) => ({ label, values }))
  ];
  
  return { dates, rows };
}
```

### Render Structure

```tsx
<Card>
  <CardContent className="pt-4">
    <div className="rounded-md border overflow-x-auto">
      <Table className="min-w-max">
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="sticky left-0 z-10 bg-muted/50 font-semibold min-w-[140px]">
              {segmentBy !== 'none' ? 'Segments' : 'Metric'}
            </TableHead>
            {dates.map(date => (
              <TableHead key={date} className="text-right font-semibold min-w-[80px]">
                {date}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={row.label}>
              <TableCell className="sticky left-0 z-10 bg-background font-medium">
                {row.label}
              </TableCell>
              {dates.map(date => (
                <TableCell key={date} className="text-right">
                  {(row.values[date] || 0).toLocaleString()}{unit}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  </CardContent>
</Card>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/analytics/AnalyticsDataTable.tsx` | Complete rewrite to horizontal layout with sticky columns, data pivoting, and removal of average comparison |
