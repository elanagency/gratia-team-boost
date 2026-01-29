
# Add Monthly Granularity to Analytics

## Overview
Add a "Monthly" option to the granularity toggle in the Analytics tab, allowing data to be grouped by month in addition to daily and weekly.

---

## What You'll Get

- New "Monthly" button in the granularity toggle (alongside Daily and Weekly)
- Chart data grouped by calendar month
- Table data showing monthly breakdowns
- Works with all existing metrics and segmentation options

---

## Implementation Details

### 1. Update Type Definition

**File:** `src/hooks/useAnalyticsData.ts`

Add `'monthly'` to the `GranularityType`:

```typescript
// Line 8
export type GranularityType = 'daily' | 'weekly' | 'monthly';
```

### 2. Add Monthly Interval Logic

**File:** `src/hooks/useAnalyticsData.ts`

Import `eachMonthOfInterval` and `endOfMonth` from date-fns (line 4):

```typescript
import { 
  startOfDay, 
  endOfDay, 
  format, 
  eachDayOfInterval, 
  eachWeekOfInterval,
  eachMonthOfInterval,
  endOfMonth 
} from "date-fns";
```

Update all interval generation logic to handle the monthly case. There are 4 locations:

| Function | Lines |
|----------|-------|
| `fetchEngagementData` | ~331-339 |
| `fetchRedemptionsData` | ~418-426 |
| `fetchLoginsData` | ~513-521 |
| `processTransactionData` | ~573-581 |

Each needs to be updated from:
```typescript
const intervals = granularity === 'daily'
  ? eachDayOfInterval({ start: startDate, end: endDate })
  : eachWeekOfInterval({ start: startDate, end: endDate });
```

To:
```typescript
const intervals = granularity === 'daily'
  ? eachDayOfInterval({ start: startDate, end: endDate })
  : granularity === 'weekly'
    ? eachWeekOfInterval({ start: startDate, end: endDate })
    : eachMonthOfInterval({ start: startDate, end: endDate });
```

And the interval end calculation from:
```typescript
const intervalEnd = granularity === 'daily'
  ? endOfDay(intervalStart)
  : endOfDay(new Date(intervalStart.getTime() + 6 * 24 * 60 * 60 * 1000));
```

To:
```typescript
const intervalEnd = granularity === 'daily'
  ? endOfDay(intervalStart)
  : granularity === 'weekly'
    ? endOfDay(new Date(intervalStart.getTime() + 6 * 24 * 60 * 60 * 1000))
    : endOfMonth(intervalStart);
```

Also update the date format for monthly display:
```typescript
date: format(intervalStart, 
  granularity === 'daily' ? 'MMM d' : 
  granularity === 'weekly' ? 'MMM d' : 
  'MMM yyyy'
)
```

### 3. Update Granularity Toggle UI

**File:** `src/components/analytics/AnalyticsFilters.tsx`

Add a third "Monthly" button to the toggle group (lines 145-163):

```tsx
{/* Granularity Toggle */}
<div className="flex items-center rounded-md border border-input bg-background">
  <Button
    variant={granularity === "daily" ? "secondary" : "ghost"}
    size="sm"
    className="rounded-r-none border-r-0"
    onClick={() => onGranularityChange("daily")}
  >
    Daily
  </Button>
  <Button
    variant={granularity === "weekly" ? "secondary" : "ghost"}
    size="sm"
    className="rounded-none border-r-0"
    onClick={() => onGranularityChange("weekly")}
  >
    Weekly
  </Button>
  <Button
    variant={granularity === "monthly" ? "secondary" : "ghost"}
    size="sm"
    className="rounded-l-none"
    onClick={() => onGranularityChange("monthly")}
  >
    Monthly
  </Button>
</div>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useAnalyticsData.ts` | Add `'monthly'` to type; import `eachMonthOfInterval` and `endOfMonth`; update 4 interval generation blocks |
| `src/components/analytics/AnalyticsFilters.tsx` | Add "Monthly" button to granularity toggle |

---

## Date Format by Granularity

| Granularity | Format | Example |
|-------------|--------|---------|
| Daily | `MMM d` | Jan 15 |
| Weekly | `MMM d` | Jan 13 (week start) |
| Monthly | `MMM yyyy` | Jan 2026 |

---

## Edge Cases

- **Partial months**: If the date range starts mid-month, the first month interval will still show the full month name but only include data from the selected start date
- **Short date ranges**: Monthly granularity with a 7-day range will show just 1-2 data points (works correctly but may be less useful)
