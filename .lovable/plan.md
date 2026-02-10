

# Move Settings Button to Right Side (Icon Only)

## What Changes

In the top navigation bar (`DashboardTopNavigation`), the **Settings** link will be moved out of the center navigation group and placed on the right side, next to the user menu. The "Settings" text label will be removed, keeping only the gear icon.

## Layout (Before -> After)

**Before:** `[Logo] --- [Dashboard] [Analytics] [Settings] [Points] --- [User Menu]`

**After:** `[Logo] --- [Dashboard] [Analytics] [Points] --- [Settings icon] [User Menu]`

## Technical Details

### `src/components/dashboard/DashboardTopNavigation.tsx`

- Remove the Settings item from the `menuItems` array (keep only Dashboard and Analytics in center nav)
- Add a standalone Settings gear icon button to the right-side section, placed before the user dropdown
- The icon uses a `Link` to `/dashboard/settings`, styled consistently with the nav (white icon, subtle hover)
- Only visible for admin users (same condition as before)

