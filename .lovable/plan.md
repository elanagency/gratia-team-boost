

# Admin Onboarding Progress Widget

## Overview
Add a dismissible onboarding checklist card that appears at the top of the admin Dashboard page, guiding new company admins through 4 setup steps with a visual progress bar.

## UX Design

The widget appears as a card above the main dashboard content (only for admins who haven't completed or dismissed it). It includes:

- A progress bar showing completion (0/4 to 4/4)
- Four steps displayed as a horizontal row of cards (stacked vertically on mobile):
  1. **Upgrade to Add Your Team** -- Start your subscription (links to the billing setup flow)
  2. **Add Team Members** -- Invite your first team member (links to team management)
  3. **Connect Slack or Teams** -- Set up notifications (links to settings notifications tab)
  4. **Allocate Birthday & Anniversary Points** -- Optional, marked with a badge (links to settings celebrations tab)
- Each step shows a check icon when complete, and the current/next step is highlighted
- A "Dismiss" button to hide the widget permanently
- Step 4 has an "Optional" label so admins know they can skip it

## How Completion Is Detected (no new DB columns needed)

Each step's completion is determined by querying existing data:

| Step | Condition |
|------|-----------|
| 1. Upgrade | Company has `stripe_subscription_id` set |
| 2. Add Members | At least 1 non-admin profile exists for the company |
| 3. Connect Slack/Teams | A row exists in `slack_integrations` or `teams_integrations` for the company |
| 4. Celebrations | Company has `birthday_points > 0` or `anniversary_points > 0` in `celebration_settings` |

## Dismissal

- Stored in `localStorage` as `onboarding_dismissed_{companyId}`
- Once all 4 steps are complete, the widget auto-hides with a brief congratulations toast
- Admin can manually dismiss at any time via a small X button

## Files to Create

### `src/components/onboarding/OnboardingChecklist.tsx`
- The main card component with progress bar and 4 step cards
- Uses a custom hook for step completion status
- Each step card is clickable and navigates to the relevant page/dialog

### `src/hooks/useOnboardingProgress.ts`
- Single hook that queries:
  - `companies` table for `stripe_subscription_id`
  - `profiles` table for non-admin member count
  - `slack_integrations` table for company row
  - `teams_integrations` table for company row
  - `celebration_settings` table for birthday/anniversary points
- Returns `{ steps: [{key, label, description, completed, optional}], completedCount, totalSteps, isFullyComplete }`

## Files to Modify

### `src/pages/admin/Dashboard.tsx`
- Import and render `OnboardingChecklist` above the main content grid, only for admin users
- Pass a callback so clicking steps can open relevant dialogs or navigate

## Visual Style
- Card with subtle border, white background
- Progress bar uses the accent color (#F572FF)
- Completed steps show a filled check circle in green
- Incomplete steps show a numbered circle outline
- Step 4 has a small "Optional" badge in muted text
- Responsive: horizontal row on desktop, vertical stack on mobile

