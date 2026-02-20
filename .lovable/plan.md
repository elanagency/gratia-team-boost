

# Fix: Company Start Date CSV Parsing (Robust Fallback)

## Problem

Despite the previous fix to `transformHeader`, the "Company Start Date" column still shows `-` in the CSV preview. The header transformation logic appears correct, but the match is still failing in practice, likely due to an encoding edge case in how PapaParse passes headers that we cannot reproduce.

## Solution

Add a **belt-and-suspenders** fallback in the row mapping section that dynamically searches all row keys for any key containing "start" (case-insensitive). This guarantees the value is found regardless of how PapaParse normalizes or transforms the header.

Additionally, add the same dynamic fallback for birthday to be safe, and add explicit console logging of the raw keys PapaParse produces so the root cause can be diagnosed if needed.

## Changes

### `src/components/team/CSVUploadDialog.tsx`

**1. Add a helper function to find a value by partial key match:**

```ts
function findValueByKeyPattern(row: any, patterns: string[]): string {
  // First try direct key access
  for (const pattern of patterns) {
    if (row[pattern] !== undefined && row[pattern] !== null) {
      return row[pattern].toString();
    }
  }
  // Fallback: search all keys case-insensitively
  const keys = Object.keys(row);
  for (const pattern of patterns) {
    const found = keys.find(k => k.toLowerCase().replace(/[^a-z ]/g, '').includes(pattern));
    if (found && row[found] !== undefined && row[found] !== null) {
      return row[found].toString();
    }
  }
  return '';
}
```

**2. Update the row mapping to use the helper:**

Replace the `companyStartDate` line (~line 255) with:

```ts
companyStartDate: normalizeDate(
  findValueByKeyPattern(row, [
    'companyStartDate', 'company start date', 'Company Start Date',
    'start date', 'Start Date', 'startdate'
  ])
)
```

And update `birthday` similarly for consistency:

```ts
birthday: normalizeDate(
  findValueByKeyPattern(row, [
    'birthday', 'Birthday', 'date of birth', 'Date of Birth', 'dob', 'DOB'
  ])
)
```

**3. Add key debugging log after PapaParse completes:**

After `console.log('Fields detected:', results.meta?.fields);` (line 236), add:

```ts
if (rawMembers.length > 0) {
  console.log('Actual row keys:', Object.keys(rawMembers[0]));
}
```

This log will reveal exactly what keys PapaParse produced, making it trivial to diagnose if the issue recurs.

## Why this will work

The previous fix relied on `transformHeader` producing the correct key. This fix bypasses that entirely by scanning all keys in the row object for any key that contains "start date" (or "birthday"). Even if `transformHeader` produces an unexpected key like `"company start date"`, `"companyStartDate"`, or something with invisible characters, the `findValueByKeyPattern` helper will find it.

## What stays the same

- The `transformHeader` function (unchanged -- it already has the `.includes()` fix)
- The `normalizeDate` function
- The `CSVPreviewStep` display component
- The processing step and edge function calls

