

# Add "Role" Column to Team Management Table

## What Changes

Add a new **Role** column to the Team Management table that displays whether each member is an "Admin" or "User".

## Details

**File: `src/components/team/TeamMemberTable.tsx`**

- Add a new `Role` table header between "Department" and "Status"
- Add a corresponding table cell that reads `member.is_admin` and displays:
  - **Admin** -- with a subtle badge style
  - **User** -- with a subtle badge style
- Update the empty-state `colSpan` from 5 to 6

This is a straightforward single-file change since `is_admin` is already available on the `CompanyMember` type from the `useCompanyMembers` hook.

