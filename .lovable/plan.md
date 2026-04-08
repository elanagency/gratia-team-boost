

# Apply Leaderboard Spacing to Settings Page

## Changes to `src/pages/admin/Settings.tsx`

### 1. Wrap return in negative-margin container
Add the same outer wrapper div used on Leaderboard to cancel `UnifiedDashboardLayout` padding:
```
className="-mx-4 -mt-16 -mb-4 lg:-mx-[60px] lg:-mt-[72px] lg:-mb-4 min-h-screen"
```

### 2. Fix sidebar padding
- `paddingLeft: 15` → **30**
- `paddingRight: 18.75` → **30**
- `marginBottom: 18.75` → **22.5** (on the title)

### 3. Fix content area padding
- Replace `padding: "22.5px"` with `padding: "22.5px 22.5px 22.5px 30px"`
- Remove `marginTop: -40` hack
- Keep `marginRight: -16` removal or normalize

## File modified
- `src/pages/admin/Settings.tsx`

