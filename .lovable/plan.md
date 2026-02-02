
# Fix Analytics Table Duplicate Rows and Filter Dropdown

## Overview
Address two issues in the Analytics page:
1. Remove duplicate "Total" rows appearing in the data table
2. Fix the segment dropdown text truncation and simplify labels

---

## Issue Analysis

### 1. Duplicate "Total" Rows
The problem occurs because of conflicting logic between two functions:

**In `useAnalyticsData.ts` (buildTableData function):**
- When there are no segments for a date, it adds a fallback row with `segmentName: 'Total'`

**In `AnalyticsDataTable.tsx` (pivotTableData function):**
- It creates a calculated "Total" row by summing all segment values
- Then it includes ALL segment names from the data, including the "Total" segment

**Result:** Two "Total" rows appear - one calculated (with real data) and one from the fallback (often with zeros).

**Solution:** In `pivotTableData`, filter out any segments named "Total" since we're already calculating a Total row.

### 2. Dropdown Truncation
Current: `w-[140px]` width is too narrow, shows "By..." when "By Person" is selected
Current labels: "By Department", "By Person"
Requested labels: "Department", "Person"

**Solution:** 
- Change width from `w-[140px]` to `w-[150px]` or remove fixed width
- Update SelectItem labels to remove "By " prefix

---

## Changes

### File 1: `src/components/analytics/AnalyticsDataTable.tsx`

**Location:** `pivotTableData` function (around line 61-66)

Filter out the "Total" segment name from the sorted segments since we calculate our own Total row:

```typescript
// Build rows: Total first, then segments alphabetically (excluding any "Total" segment from data)
const sortedSegments = Object.keys(segmentMap)
  .filter(label => label !== 'Total')
  .sort();
```

### File 2: `src/components/analytics/AnalyticsFilters.tsx`

**Location:** Segment By Selector (around line 133-143)

1. Increase width from `w-[140px]` to `w-[160px]`
2. Change labels from "By Department" / "By Person" to "Department" / "Person"

```tsx
<Select value={segmentBy} onValueChange={(value) => onSegmentChange(value as SegmentType)}>
  <SelectTrigger className="w-[160px]">
    <SelectValue placeholder="Segment by" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="none">All</SelectItem>
    <SelectItem value="department">Department</SelectItem>
    <SelectItem value="person">Person</SelectItem>
  </SelectContent>
</Select>
```

---

## Visual Result

### Before:
| Segments | Jan 19 | Jan 20 | ... |
|----------|--------|--------|-----|
| Total | 0 pts | 0 pts | 20 pts |
| Piers Chen | 0 pts | 0 pts | 20 pts |
| Total | 0 pts | 0 pts | 0 pts |

### After:
| Segments | Jan 19 | Jan 20 | ... |
|----------|--------|--------|-----|
| Total | 0 pts | 0 pts | 20 pts |
| Piers Chen | 0 pts | 0 pts | 20 pts |

### Dropdown Before:
- Shows "By..." (truncated)
- Options: "All", "By Department", "By Person"

### Dropdown After:
- Shows "Department" or "Person" (full text visible)
- Options: "All", "Department", "Person"

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/analytics/AnalyticsDataTable.tsx` | Filter out "Total" segment to prevent duplicate row |
| `src/components/analytics/AnalyticsFilters.tsx` | Increase dropdown width and simplify label text |
