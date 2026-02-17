

# Onboarding Improvements (5 Changes)

## 1. Fix Welcome Email Company Name

**Problem:** The Brevo template uses `{{ company_name }}` but the edge function sends `company` as the parameter key.

**Fix:** In `supabase/functions/send-welcome-email/index.ts`, change the `templateParams` key from `company` to `company_name`:

```
templateParams: {
  fname: firstName,
  company_name: companyName   // was: company
}
```

## 2. Sequential Step Locking

**Problem:** All incomplete steps are currently clickable. Only the current (next incomplete) step should be clickable; future steps should show a lock icon and be disabled.

**Fix in `OnboardingChecklist.tsx`:**
- Change the logic so only steps that are completed OR are the "next" step are interactive
- Future locked steps get `disabled` styling (opacity, no hover, cursor-not-allowed)
- Replace the step number circle with a `Lock` icon (from lucide-react) for locked future steps
- Completed steps keep the green checkmark; the active step keeps the accent number badge

## 3. Fix "Add Team Members" Dead-End Route

**Problem:** The onboarding step links to `/dashboard/team`, but no route exists for that path in `App.tsx` -- it hits the 404 catch-all.

**Fix:** Change the step route from `/dashboard/team` to `/dashboard/settings?tab=team` in the `stepRoutes` map in `OnboardingChecklist.tsx`. This takes the admin directly to the Team tab inside Settings where they can invite members.

## 4. Prevent Closing Onboarding Until Step 3 Complete

**Problem:** The dismiss (X) button is always visible, letting admins close the checklist before they've meaningfully onboarded.

**Fix in `OnboardingChecklist.tsx`:**
- Only show the X dismiss button when the first 3 required steps (upgrade, members, integrations) are all completed
- This means the checklist stays visible until they finish step 3. Since step 4 is optional, they can dismiss after step 3.
- The auto-dismiss on full completion remains as-is

## 5. Header Onboarding Progress Widget

**Problem:** The onboarding checklist is only visible on the main dashboard page, so admins navigating to Settings or other pages lose sight of their progress.

**New component: `OnboardingProgressWidget`** -- a small pill/badge in the top navigation bar (next to the Grattia logo) showing progress like "2/4 Setup" with a mini progress ring or bar. Clicking it navigates back to the dashboard.

**Details:**
- New file: `src/components/onboarding/OnboardingProgressWidget.tsx`
- Uses the existing `useOnboardingProgress` hook
- Renders a small pill: accent-colored progress indicator + "X/4" text
- Hidden when onboarding is fully complete or dismissed (reads same localStorage key)
- Placed in `DashboardTopNavigation.tsx` next to the logo, only for admin users

---

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/send-welcome-email/index.ts` | Fix `company` to `company_name` in templateParams |
| `src/components/onboarding/OnboardingChecklist.tsx` | Lock future steps, hide X until step 3 done, fix route |
| `src/components/onboarding/OnboardingProgressWidget.tsx` | New header widget component |
| `src/components/dashboard/DashboardTopNavigation.tsx` | Add OnboardingProgressWidget next to logo |

