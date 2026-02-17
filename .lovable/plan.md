

# Remove Departments Tab, Add "Manage Departments" Button to Team Tab

## Overview

Remove the dedicated "Departments" tab from Settings and instead add a subtle "Manage Departments" button on the Team Management tab that opens the existing department management UI in a dialog.

## Changes

### 1. `src/pages/admin/Settings.tsx`
- Remove the `<TabsTrigger value="departments">` tab
- Remove the `<TabsContent value="departments">` block
- Remove the `DepartmentManagement` import

### 2. `src/components/settings/TeamManagementCard.tsx`
- Add a "Manage Departments" button (subtle, using `variant="outline"` or `variant="ghost"`) next to the existing "Invite Team Member" and "Upload CSV" buttons
- Clicking it opens a Dialog containing the existing `DepartmentManagement` component (without the outer Card wrapper)
- Import `DepartmentManagement` and wrap it in a `Dialog`

### 3. `src/components/team/DepartmentManagement.tsx`
- Add an optional `embedded` prop (boolean) so that when rendered inside the Team tab dialog, it skips the outer `<Card>` wrapper and renders just the content directly
- When `embedded={true}`: render without Card/CardHeader, just the department list with add/edit/delete functionality
- When `embedded={false}` (default): keep existing Card-wrapped layout for any other usage

## Result

The Settings tabs will be: Company, Team, Celebrations, Billing, Notifications. The Team tab will have a small "Manage Departments" button that opens a clean dialog for creating, editing, and deleting departments.

