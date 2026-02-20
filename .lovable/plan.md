

# Fix: Syntax Error in CSVUploadDialog.tsx

## Problem

The last edit introduced a **duplicate `if (results.errors.length > 0)` statement** (lines 257-258). The first `if` opens a block with no body or closing brace, causing everything after it to be scoped incorrectly. This results in:
- Build error: "Declaration or statement expected"
- Runtime error: "Cannot access 'rawMembers' before initialization"
- The settings page (and any page importing this component) crashes

## Fix

Remove the duplicate line at line 257-258. The corrected section should be:

```ts
complete: (results) => {
  console.log('Papa parse results:', results);
  console.log('Raw data:', results.data);
  console.log('Fields detected:', results.meta?.fields);
  
  if (results.errors.length > 0) {
    console.error('Papa parse errors:', results.errors);
  }

  const rawMembers = results.data as any[];
  // ... rest of code
```

Instead of the current broken version:

```ts
  if (results.errors.length > 0) {   // <-- DUPLICATE, no body/closing brace
  
  if (results.errors.length > 0) {   // <-- real one
    console.error('Papa parse errors:', results.errors);
  }
```

## Scope

Single file change: `src/components/team/CSVUploadDialog.tsx`, lines 257-258 -- remove the duplicate `if` and the blank line.

