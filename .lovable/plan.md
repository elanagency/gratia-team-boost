
# Add CSV Export Button to Analytics Data Table

## Overview
Add an export button to the analytics data table that allows users to download the current view as a CSV file. The button will be positioned in the table header area.

---

## Visual Design

```
┌────────────────────────────────────────────────────────────────────┐
│                                                    [⬇ Export CSV]  │
├──────────────────┬──────────┬──────────┬──────────┬───────────────┤
│ Segments         │ Jan 20   │ Jan 21   │ Jan 22   │ ...           │
├──────────────────┼──────────┼──────────┼──────────┼───────────────┤
│ Total            │ 50 pts   │ 48 pts   │ 52 pts   │ ...           │
│ Sales            │ 25 pts   │ 22 pts   │ 28 pts   │ ...           │
└──────────────────┴──────────┴──────────┴──────────┴───────────────┘
```

---

## CSV Output Format

The CSV will match the table layout:

```csv
Segments,Jan 20,Jan 21,Jan 22,Jan 23
Total,50,48,52,45
Sales,25,22,28,20
Marketing,15,16,14,15
Engineering,10,10,10,10
```

- First row: Header with "Segments" (or "Metric") and date columns
- Subsequent rows: Row label followed by values for each date
- Values exported as raw numbers (without units like "pts" or "%")

---

## Technical Details

**File:** `src/components/analytics/AnalyticsDataTable.tsx`

### 1. Add imports

```typescript
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import Papa from "papaparse";
```

### 2. Add export function

Create a function to convert the pivoted data to CSV and trigger download:

```typescript
const handleExportCSV = () => {
  // Build CSV data array
  const headerRow = [segmentBy !== 'none' ? 'Segments' : 'Metric', ...dates];
  
  const dataRows = rows.map(row => [
    row.label,
    ...dates.map(date => row.values[date] || 0)
  ]);
  
  const csvData = [headerRow, ...dataRows];
  
  // Generate CSV string using papaparse
  const csv = Papa.unparse(csvData);
  
  // Create download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `analytics-${metric}-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
```

### 3. Update Card layout

Add a header row with the export button:

```tsx
<Card>
  <CardContent className="pt-4">
    <div className="flex justify-end mb-3">
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportCSV}
        className="gap-2"
      >
        <Download className="h-4 w-4" />
        Export CSV
      </Button>
    </div>
    <div className="rounded-md border overflow-x-auto">
      {/* existing table */}
    </div>
  </CardContent>
</Card>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/analytics/AnalyticsDataTable.tsx` | Add papaparse import, export function, and export button UI |
