

# Fix CSV Date Parsing and Display

## Problems Found

1. **Company Start Date not saved**: The CSV contains dates in US format (e.g., "2/17/2022") which PostgreSQL's `date` column doesn't accept. The value gets silently dropped, resulting in `null` in the database. The birthday "2/17/1991" happened to be accepted by Postgres in some cases, but the start date was not -- both need proper conversion.

2. **Birthday displays one day behind**: The database stores "1991-02-17" correctly, but `new Date("1991-02-17")` in JavaScript interprets date-only strings as UTC midnight. In US timezones (UTC-5 to UTC-8), this shifts to the previous day (Feb 16).

## Root Causes

- The CSV parsing code passes raw date strings (like "2/17/2022") directly to the edge function without converting to ISO format (YYYY-MM-DD)
- The display code uses `new Date(dateString)` which interprets YYYY-MM-DD as UTC, causing timezone shift

## Changes

### 1. `src/components/team/CSVUploadDialog.tsx` -- Add date normalization

Add a helper function that converts various date formats (M/D/YYYY, MM/DD/YYYY, D/M/YYYY, YYYY-MM-DD, etc.) to the ISO `YYYY-MM-DD` format before sending to the edge function.

Apply this normalization in the `parseCSV` callback when mapping rows (around line 226), converting `birthday` and `companyStartDate` values to ISO format.

```typescript
function normalizeDate(dateStr: string): string {
  if (!dateStr || !dateStr.trim()) return '';
  const trimmed = dateStr.trim();
  
  // Already ISO format
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  
  // US format: M/D/YYYY or MM/DD/YYYY
  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, month, day, year] = slashMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // Dash format: M-D-YYYY
  const dashMatch = trimmed.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dashMatch) {
    const [, month, day, year] = dashMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  return trimmed; // Return as-is if no match
}
```

### 2. `src/components/team/TeamMemberTable.tsx` -- Fix timezone-safe date display

Replace `new Date(member.birthday)` and `new Date(member.company_start_date)` with a timezone-safe parsing approach that treats the date string as local rather than UTC.

```typescript
// Before (timezone bug):
format(new Date(member.birthday), 'MMM d')

// After (timezone safe):
format(new Date(member.birthday + 'T00:00:00'), 'MMM d')
```

Appending `T00:00:00` (without a `Z`) forces JavaScript to parse it as local time instead of UTC.

## Files Modified

| File | Change |
|------|--------|
| `src/components/team/CSVUploadDialog.tsx` | Add `normalizeDate()` helper; apply to birthday and companyStartDate during CSV parsing |
| `src/components/team/TeamMemberTable.tsx` | Append `T00:00:00` to date strings before creating Date objects to prevent UTC timezone shift |

