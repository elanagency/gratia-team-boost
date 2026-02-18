

# Fix: Step 2 Should Complete on Invite, Not Activation

## Problem

The "Add Team Members" onboarding step checks for non-admin profiles with `status = 'active'`. When you invite someone, their status is `'invited'`, so the step doesn't show as complete until they log in and become active.

## Fix

### File: `src/hooks/useOnboardingProgress.ts`

Change the members query (line 40) from:
```
.eq("status", "active")
```
to:
```
.in("status", ["active", "invited"])
```

This way, as soon as one non-admin team member exists (whether invited or active), step 2 marks as complete.

One-line change, no other files affected.

