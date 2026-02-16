
# Hide Dropdown Navigation Items

## Summary
Remove the "Profile Settings" and "Company Settings" links from the user dropdown menu, keeping only the user info display and the "Log out" option. The pages themselves remain intact and accessible via direct URL -- only the navigation links are hidden.

## Technical Details

### File: `src/components/dashboard/DashboardTopNavigation.tsx`
- **Remove lines 116-129**: Delete the two `DropdownMenuItem` blocks for "Profile Settings" and "Company Settings"
- The dropdown will then only show the user's name/email header and the "Log out" button
- The Settings gear icon in the header (for admins) remains unchanged
