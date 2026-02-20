

# Fix: Company Start Date Not Parsing in CSV Upload

## Root Cause

The `transformHeader` function in `CSVUploadDialog.tsx` uses exact string comparison (`===`) to match headers. When a CSV is exported from Google Sheets, the last column header ("Company Start Date") can include invisible characters (e.g., carriage return, BOM, non-breaking spaces) that survive `.trim()` but break the exact match.

When the match fails, `transformHeader` falls through to `return normalized`, producing the key `"company start date"`. But the row mapping code never looks for that key -- it only checks `row.companyStartDate`, `row['Company Start Date']`, `row['start date']`, and `row['Start Date']`. None of these match, so the value is lost.

Birthday works because it appears earlier in the CSV row and doesn't pick up trailing characters from end-of-line parsing.

## Solution

Make `transformHeader` use `.includes()` instead of `===` for matching, and strip all non-printable characters before comparing. This handles invisible characters from various spreadsheet exports.

## Changes

### `src/components/team/CSVUploadDialog.tsx`

**1. Update `transformHeader` to use inclusive matching:**

Replace the current exact-match checks with `.includes()`-based checks that are more resilient:

```ts
transformHeader: (header: string) => {
  // Strip non-printable/invisible characters, then lowercase and trim
  const normalized = header
    .replace(/[^\x20-\x7E]/g, '') // Remove non-printable ASCII
    .toLowerCase()
    .trim();
    
  if (['name', 'full name', 'fullname'].includes(normalized)) return 'name';
  if (['email', 'email address', 'emailaddress'].includes(normalized)) return 'email';
  if (['department', 'dept'].includes(normalized)) return 'department';
  if (['role', 'user role', 'userrole'].includes(normalized)) return 'role';
  if (['birthday', 'date of birth', 'dob'].includes(normalized)) return 'birthday';
  
  // Use includes() for start date to handle partial matches
  if (normalized.includes('start date') || normalized === 'startdate') return 'companyStartDate';
  if (normalized.includes('birthday') || normalized.includes('birth')) return 'birthday';
  
  return normalized;
}
```

**2. Add normalized-key fallback in row mapping:**

In the row mapping section, add `row['company start date']` as a fallback:

```ts
companyStartDate: normalizeDate((
  row.companyStartDate || 
  row['company start date'] ||  // <-- ADD THIS fallback
  row['Company Start Date'] || 
  row['start date'] || 
  row['Start Date'] || 
  ''
).toString())
```

Also add `row['birthday']` fallback for consistency:

```ts
birthday: normalizeDate((
  row.birthday || 
  row.Birthday || 
  row['date of birth'] || 
  row['Date of Birth'] || 
  row.dob || 
  row.DOB || 
  ''
).toString())
```

## What stays the same

- The `normalizeDate` function is unchanged
- The `CSVPreviewStep` display logic is unchanged
- The `create-team-member` edge function is unchanged
- The processing step and backend flow are unchanged

## Testing

After the fix, uploading the same sample CSV from Google Sheets should show the dates (2023-01-10, 2022-06-01, 2024-03-15) in the Start Date column of the preview step instead of "-".

