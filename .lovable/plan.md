

# Fix: Step 2 Completes When Any Second User Exists

## Problem

The current query for the "Add Team Members" step filters by `is_admin = false`, so it only counts non-admin members. The user wants it to complete as soon as there is more than one person in the company -- regardless of admin status or activation status.

## Change

### File: `src/hooks/useOnboardingProgress.ts`

In the `membersRes` query (around lines 36-41):

- Remove the `.eq("is_admin", false)` filter
- Remove the `.in("status", ["active", "invited"])` filter
- Keep the `company_id` filter and the count-only select

Then update the `hasMembers` check from `memberCount > 0` to `memberCount > 1` (since the admin themselves is now included in the count).

This means: as soon as an invite is sent and a second profile row exists in the company, step 2 shows as complete.

