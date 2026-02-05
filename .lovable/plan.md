
# Add Role Selection for Team Member Onboarding

## Overview

This feature adds a "Role" selection dropdown to the team member invitation flow, allowing company admins to assign either "User" or "Admin" roles when inviting new team members. Admin role grants access to Analytics and Settings pages, while User role only has access to the Dashboard and Gift Cards.

---

## Current State

- **Invite Dialog**: Has Name, Email, and Department fields only
- **Edit Member Dialog**: Has Name, Email (disabled), and Department fields only
- **CSV Upload**: Template has Name, Email, Department columns
- **Role Storage**: The `profiles` table already has an `is_admin` boolean column
- **Access Control**: Navigation is already filtered based on `isAdmin` in `DashboardTopNavigation.tsx`

---

## Implementation Plan

### 1. Update InviteForm Component
**File: `src/components/team/InviteForm.tsx`**

Add a Role selection dropdown between Department and Submit button:
- Add `role` and `setRole` props to the interface
- Add a Select dropdown with options: "User" (default) and "Admin"
- Style consistently with existing form fields

### 2. Update InviteTeamMemberDialog Component
**File: `src/components/team/InviteTeamMemberDialog.tsx`**

- Add `role` state (default: "user")
- Pass `role` and `setRole` to InviteForm
- Update the edge function call to pass `is_admin: role === 'admin'`

### 3. Update EditMemberForm Component
**File: `src/components/team/EditMemberForm.tsx`**

- Add `role` state initialized from `member.is_admin`
- Add Role selection dropdown (User/Admin)
- Update the `updateMember` function call to include `is_admin`

### 4. Update useCompanyMembers Hook
**File: `src/hooks/useCompanyMembers.ts`**

- Extend `updateMember` function to accept `is_admin` in updateData
- Update the Supabase query to set `is_admin` field

### 5. Update create-team-member Edge Function
**File: `supabase/functions/create-team-member/index.ts`**

- Accept `is_admin` boolean parameter in request body (currently only uses `role: 'member'`)
- Use `is_admin` value when creating the profile

### 6. Update CSV Upload Template & Processing
**File: `src/components/team/CSVUploadDialog.tsx`**

Update sample CSV to include Role column:
```csv
Name,Email,Department,Role
John Doe,john@example.com,Engineering,user
Jane Smith,jane@example.com,Marketing,admin
```

Update `CSVMember` interface and parsing logic to include role field.

### 7. Update CSVPreviewStep Component
**File: `src/components/team/csv/CSVPreviewStep.tsx`**

- Add Role column to the preview table
- Display "Admin" or "User" for each row

### 8. Update CSV Processing Logic
**File: `src/components/team/CSVUploadDialog.tsx`**

- Pass `is_admin: member.role === 'admin'` to the create-team-member function

---

## Technical Details

### Role Selection UI Component

```text
┌─────────────────────────────────────┐
│ Role *                              │
│ ┌─────────────────────────────────┐ │
│ │ User                          ▼ │ │
│ └─────────────────────────────────┘ │
│                                     │
│  Options:                           │
│  • User - Standard team member      │
│  • Admin - Can access Analytics     │
│            and Settings             │
└─────────────────────────────────────┘
```

### Data Flow

| Component | Passes to | Value |
|-----------|-----------|-------|
| InviteForm | InviteTeamMemberDialog | `role: 'user' \| 'admin'` |
| InviteTeamMemberDialog | Edge Function | `is_admin: boolean` |
| Edge Function | Database | `profiles.is_admin` |

### CSV Format (Updated)

| Column | Required | Values |
|--------|----------|--------|
| Name | Yes | Any text |
| Email | Yes | Valid email |
| Department | Optional | Any text |
| Role | Optional | "user" (default), "admin" |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/team/InviteForm.tsx` | Add role prop and Select dropdown |
| `src/components/team/InviteTeamMemberDialog.tsx` | Add role state, pass to form and edge function |
| `src/components/team/EditMemberForm.tsx` | Add role dropdown for editing existing members |
| `src/hooks/useCompanyMembers.ts` | Extend updateMember to accept is_admin |
| `supabase/functions/create-team-member/index.ts` | Accept and use is_admin parameter |
| `src/components/team/CSVUploadDialog.tsx` | Update template, parsing, and processing |
| `src/components/team/csv/CSVPreviewStep.tsx` | Add Role column to preview table |

---

## Access Control Verification

The current access control is already implemented correctly:

```typescript
// DashboardTopNavigation.tsx - Lines 30-42
...(isAdmin ? [
  {
    name: "Analytics",
    icon: BarChart3,
    path: "/dashboard/analytics"
  },
  {
    name: "Settings",
    icon: Settings,
    path: "/dashboard/settings"
  }
] : [])
```

Users with `is_admin: false` will only see the Dashboard menu item, while users with `is_admin: true` will see Dashboard, Analytics, and Settings.

---

## Expected Behavior

| User Role | Dashboard | Analytics | Settings | Gift Cards |
|-----------|:---------:|:---------:|:--------:|:----------:|
| Admin | ✓ | ✓ | ✓ | ✓ |
| User | ✓ | ✗ | ✗ | ✓ |

