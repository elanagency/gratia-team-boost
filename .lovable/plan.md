

## Add Horizontal Padding to Settings Content Area

### Problem
The content (Company Profile card) is flush against the vertical divider line because the `marginLeft: 160` only offsets to the divider position but adds no breathing room.

### Fix

**File: `src/pages/admin/Settings.tsx`** (line 114)

Add `paddingLeft` and `paddingRight` to the content area div so the card has even spacing on both sides:

```tsx
<div style={{ marginLeft: 160, paddingTop: 22.5, paddingLeft: 22.5, paddingRight: 22.5 }}>
```

This adds ~22.5px padding on both left (after the divider) and right sides, matching the Figma spacing pattern used elsewhere in the app.

### Files to modify
1. `src/pages/admin/Settings.tsx` — add horizontal padding to content wrapper (line 114)

