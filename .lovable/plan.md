

# Billing Card — Show Per-Celebration-Type Upcoming Charges

## What changes
The "Current Plan" card on Settings → Billing currently shows one generic "Celebration charges" line. Replace it with **separate lines per celebration type**, each showing the upcoming count × admin-set dollar value, matching the Figma:

```
Seats                       12 × $10 = $120.00
Birthdays (3 upcoming)       3 × $15 =  $45.00
Work Anniversaries (4 upc.)  4 × $10 =  $40.00
─────────────────────────────────────────────
Total due April 1, 2026                $205.00
```

Lines only appear when:
- The celebration type is **enabled** on the company (`birthday_rewards_enabled` / `anniversary_rewards_enabled`), AND
- There is **≥1 upcoming event** in the current billing cycle.

Also fix:
- "Next billing date" currently shows `—`. Populate it from Stripe (`current_period_end` on the active subscription) or fall back to `billing_cycle_anchor` + 1 month from `companies`.
- Total due = Seats subtotal + each enabled celebration subtotal.
- Keep "/seat/mo" label as "/user/mo" to match Figma.

## How upcoming counts are calculated
Reuse the existing logic in `CelebrationSettingsCard` "Upcoming this month" (already counts birthdays/anniversaries in the next billing window from `profiles.birthday` and `profiles.company_start_date`). Extract it into a small shared hook `useUpcomingCelebrations(companyId)` returning `{ upcomingBirthdays, upcomingAnniversaries, nextBillingDate }`, consumed by both:
- `CelebrationSettingsCard.tsx` (existing UI)
- `BillingCard.tsx` (new line items)

The dollar amount per event comes from:
- Birthday: `companies.birthday_reward_points × point_exchange_rate`
- Anniversary: `companies.anniversary_reward_points × point_exchange_rate`

(Snapshot exactly mirrors what `process-celebration-rewards` will charge when the event fires.)

## Files modified
- `src/hooks/useUpcomingCelebrations.ts` — new shared hook (extracted from `CelebrationSettingsCard`).
- `src/components/settings/BillingCard.tsx` — replace generic celebration line with per-type lines, populate Next billing date, recompute Total.
- `src/components/settings/CelebrationSettingsCard.tsx` — switch to the shared hook (no UI change).

## Notes
- No DB or edge-function changes — purely a UI calculation update on top of existing data.
- The "pending invoice items already created in Stripe" line from the previous iteration is dropped in favor of this forward-looking projection, since it matches the Figma and is what admins actually want to see.

