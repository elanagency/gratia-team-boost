

# Post-Pay Celebration Billing

Move celebrations from a **prepaid wallet** model to a **postpaid invoice-item** model. Admins set a dollar value per birthday/anniversary; events accrue through the month; on the next Stripe billing cycle, the company is billed for actual celebrations sent.

## How it will work

1. Admin sets birthday = $25, anniversary = $50 in Settings → Celebrations.
2. When a celebration runs (existing daily cron), instead of deducting from a wallet:
   - Recipient still gets the points (existing behavior preserved).
   - A row is logged in `celebration_rewards_log` with the **dollar amount charged** at that moment.
   - A pending **Stripe invoice item** is added to the company's existing subscription customer.
3. On the next Stripe monthly invoice (the one that already bills seats), all pending celebration invoice items get rolled into that invoice automatically — one line per celebration ("🎂 Birthday — Jane Doe — $25.00").
4. Settings page shows:
   - **Upcoming this month** — projected accrual (count × dollar amount).
   - **Recently sent** — actual logged events with dollar amounts and invoice status (Pending / Billed).

## UI changes — `CelebrationSettingsCard.tsx`

- Remove the **Company Wallet** block, the **Buy Points** button, and the "Wallet may not cover annual cost" warning.
- Replace with a **billing summary** block:
  - "Accrued this cycle: $X.XX (N celebrations)"
  - "Will be added to your next invoice on {next_billing_date}"
- Keep the existing $-based inputs for birthday/anniversary amounts.
- **Upcoming this month** table: replace the "$0.00" charge column with the actual projected dollar amount (`birthday_reward_points × rate` or `anniversary_reward_points × rate`).
- **Recently sent** table: add a "Charged" column showing dollar amount + status badge (Pending / Billed).

## Backend changes

### Schema (migration)
- Add `dollar_amount NUMERIC(10,2)` to `celebration_rewards_log` — the dollars charged at event time (snapshot — protects against rate changes).
- Add `stripe_invoice_item_id TEXT` to `celebration_rewards_log` — set when the invoice item is created.
- Add `billing_status TEXT DEFAULT 'pending'` to `celebration_rewards_log` — `pending` | `invoiced` | `failed`.
- Keep `points_awarded` (still needed — recipient still receives points).

### `process-celebration-rewards` edge function
- Stop reading/decrementing `companies.points_balance`.
- Stop the "insufficient balance" skip path.
- Still credit the recipient's `profiles.points` and create a `point_transactions` row + notifications + email (unchanged).
- After logging to `celebration_rewards_log`, call Stripe:
  - Pick the right Stripe key (live/test) using existing `companies.environment` routing.
  - `stripe.invoiceItems.create({ customer, amount, currency, description, subscription })` → attaches to the next invoice for the company's subscription.
  - Save `invoice_item.id` and set `billing_status = 'pending'` on the log row.
  - On Stripe failure, mark `billing_status = 'failed'` and surface in admin UI (don't block the recognition itself).

### `BillingCard.tsx`
- Add a small **"Celebration charges next invoice"** line item under Seats showing `SUM(dollar_amount) WHERE billing_status='pending' AND company_id=…`, so admins see total upcoming charges in one place.

### Optional cleanup (kept conservative)
- Leave `companies.points_balance` and `BuyPointsDialog` in place but unused for celebrations — used elsewhere? Quick check during implementation; if nothing else depends on it, hide the Buy Points entry point.

## Files modified
- `src/components/settings/CelebrationSettingsCard.tsx` — remove wallet UI, show accrual, populate dollar columns.
- `src/components/settings/BillingCard.tsx` — add pending celebration charges line.
- `supabase/functions/process-celebration-rewards/index.ts` — drop wallet logic, add Stripe invoice-item creation.
- New migration — add `dollar_amount`, `stripe_invoice_item_id`, `billing_status` to `celebration_rewards_log`.

## Notes
- Companies without an active Stripe subscription can't accrue — we'll log the event with `billing_status='failed'` and show a banner prompting them to activate billing.
- Rate changes mid-cycle don't affect already-logged events (dollar amount is snapshotted).
- Recognition / point grant always succeeds even if the Stripe call fails — failures are visible to admins for manual reconciliation.

