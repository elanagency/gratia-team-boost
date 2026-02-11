

# Move Settings to User Dropdown Menu

## What Changes

Move the Settings gear icon from the top navigation bar into the user dropdown menu, alongside "Profile Settings" and "Log out". This simplifies the header and keeps all user/admin actions in one place.

## Changes

**File: `src/components/dashboard/DashboardTopNavigation.tsx`**

1. Remove the standalone Settings icon button from the right side of the nav bar (the `isAdmin && (...)` block with the gear icon before the dropdown)
2. Add a new "Company Settings" menu item inside the `DropdownMenuContent`, between "Profile Settings" and "Log out" -- only visible to admin users
3. The menu item will use the Settings icon and link to `/dashboard/settings`

The result in the dropdown will be:
- Profile Settings
- Company Settings (admin only)
- Log out

