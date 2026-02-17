
# Add Spacing Between Logo and Setup Pill

## Change

In `src/components/dashboard/DashboardTopNavigation.tsx`, line 58, add `gap-4` to the flex container that holds both the logo and the onboarding progress widget.

**Before:**
```
<div className="flex items-center relative z-10">
```

**After:**
```
<div className="flex items-center gap-4 relative z-10">
```

This adds 1rem (16px) of spacing between the Grattia logo and the "0/4 Setup" pill, giving it a cleaner, less crowded look.

## Files Modified

| File | Change |
|------|--------|
| `src/components/dashboard/DashboardTopNavigation.tsx` | Add `gap-4` to the logo container div |
