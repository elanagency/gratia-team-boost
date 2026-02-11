

# Add Birthday and Company Start Date Fields

## Overview

Add two new date fields -- **Birthday** and **Company Start Date** -- to team member profiles. These will appear in the invite form, edit form, CSV upload, and team member table.

## Changes Required

### 1. Database Migration

Add two new nullable columns to the `profiles` table:

- `birthday` (date, nullable)
- `company_start_date` (date, nullable)

### 2. `src/hooks/useCompanyMembers.ts`

- Add `birthday` and `company_start_date` to the `CompanyMember` interface
- Add both fields to the Supabase select query
- Map both fields into the formatted member objects

### 3. `src/components/team/InviteForm.tsx`

- Add two date input fields (`<Input type="date">`) for Birthday and Company Start Date (both optional)
- Add corresponding props to the interface (`birthday`, `setBirthday`, `companyStartDate`, `setCompanyStartDate`)

### 4. `src/components/team/InviteTeamMemberDialog.tsx`

- Add `birthday` and `companyStartDate` state variables
- Pass them to `InviteForm` and include them in the `create-team-member` edge function call body
- Reset them on close/success

### 5. `src/components/team/EditMemberForm.tsx`

- Add `birthday` and `companyStartDate` state initialized from `member.birthday` / `member.company_start_date`
- Add two date input fields to the form
- Include both fields in the `updateMember` call

### 6. `src/hooks/useCompanyMembers.ts` - `updateMember`

- Accept `birthday` and `company_start_date` in the update payload and pass them to the Supabase update

### 7. `src/components/team/TeamMemberTable.tsx`

- Add "Birthday" and "Start Date" columns to the table header
- Display formatted dates (or "-") in the corresponding cells
- Update the empty state colSpan from 6 to 8

### 8. CSV Upload Changes

**`src/components/team/CSVUploadDialog.tsx`**:
- Add `birthday` and `companyStartDate` to `CSVMember` interface
- Update `parseCSV` header normalization to handle "birthday", "date of birth", "dob", "start date", "company start date"
- Pass both fields to the `create-team-member` edge function call
- Update sample CSV to include the new columns

**`src/components/team/csv/CSVUploadStep.tsx`**:
- Update the format example text to show the new columns

**`src/components/team/csv/CSVPreviewStep.tsx`**:
- Add `birthday` and `companyStartDate` to the `CSVMember` interface
- Add columns to the preview table

### 9. `supabase/functions/create-team-member/index.ts`

- Accept `birthday` and `companyStartDate` from the request body
- Include them in the profile insert/update query

### 10. Profile Settings (team member view)

**`src/pages/admin/ProfileSettings.tsx`**:
- Fetch and display birthday and company start date (read-only or editable) so team members can also see their own dates

## What Will NOT Change

- No changes to billing, points, or subscription logic
- No changes to RLS policies (existing profile update policies cover new columns)
- Fields are all optional so no existing flows break

