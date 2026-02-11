

# Birthday and Anniversary Rewards -- Business Logic and Implementation Plan

## How It Works (Plain English)

1. **Company Admin goes to Settings** and finds a new "Celebrations" tab
2. They toggle on **Birthday Rewards** and/or **Anniversary Rewards**, setting how many points each event should give (e.g. 50 points on birthday, 100 points on work anniversary)
3. The company has a **points wallet** (already exists as `points_balance` on the companies table). The admin tops it up by purchasing points -- e.g. buying 1,000 points at $0.05 each = $50.00
4. **Every day**, a background job checks: "Does any employee have a birthday or work anniversary today?" If yes, it deducts points from the company wallet and adds them to that employee's redeemable balance (`points` on profiles)
5. If the wallet runs low, the admin gets a warning. If it hits zero, rewards pause until topped up

## Cost Visibility

When configuring, the admin sees a cost estimator:

```text
Birthday Rewards:    100 pts x 12 employees = 1,200 pts/year = $60.00/year
Anniversary Rewards:  50 pts x 12 employees =   600 pts/year = $30.00/year
                                        Total: 1,800 pts/year = $90.00/year
Current wallet balance: 500 pts ($25.00)
```

This helps them decide how many points to buy.

## Data Model Changes

### New columns on `companies` table

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `birthday_rewards_enabled` | boolean | false | Toggle for birthday rewards |
| `birthday_reward_points` | integer | 0 | Points given on each birthday |
| `anniversary_rewards_enabled` | boolean | false | Toggle for anniversary rewards |
| `anniversary_reward_points` | integer | 0 | Points given on each work anniversary |

### New table: `celebration_rewards_log`

Tracks every automated reward distribution for auditing and duplicate prevention.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | Auto-generated |
| `company_id` | uuid (FK) | Which company |
| `profile_id` | uuid (FK) | Which employee received |
| `reward_type` | text | "birthday" or "anniversary" |
| `points_awarded` | integer | How many points given |
| `event_date` | date | The actual birthday/anniversary date |
| `year` | integer | The year this was awarded (prevents duplicates) |
| `created_at` | timestamptz | When it was processed |

Unique constraint on `(company_id, profile_id, reward_type, year)` to prevent double-awarding.

## Frontend Changes

### Settings Page -- New "Celebrations" Tab

Added to the existing tabbed Settings page (`src/pages/admin/Settings.tsx`):

- **Birthday Rewards** section: Toggle switch + points amount input
- **Anniversary Rewards** section: Toggle switch + points amount input
- **Cost Estimator**: Shows projected annual cost based on team size and exchange rate
- **Company Wallet**: Shows current balance with a "Buy Points" button
- **Reward History**: Table of recent automated rewards from `celebration_rewards_log`

### Buy Points Flow

A new edge function `purchase-company-points` creates a Stripe Checkout session for a one-off purchase. The admin picks a quantity (e.g. 1,000 points at $0.05 each = $50). On successful payment, the company's `points_balance` is credited.

## Backend -- Daily Cron Job

A new edge function `process-celebration-rewards` runs daily via pg_cron:

1. Query all companies where birthday or anniversary rewards are enabled
2. For each company, find employees whose birthday (month/day) or company_start_date (month/day) matches today
3. Check `celebration_rewards_log` to skip anyone already rewarded this year
4. For each match: check company `points_balance` is sufficient, deduct from wallet, add to employee's `points` (redeemable), log to `celebration_rewards_log`, create a `point_transaction` record
5. If wallet is insufficient, skip and optionally flag the company for a low-balance notification

## Implementation Phases

### Phase 1: Database and Configuration UI
- Migration: add columns to `companies`, create `celebration_rewards_log` table
- Build the "Celebrations" settings tab with toggles, point amounts, and cost estimator
- Show current wallet balance

### Phase 2: Buy Points
- Edge function `purchase-company-points` (Stripe Checkout for one-off point purchase)
- Webhook or verification to credit `points_balance` after payment
- "Buy Points" button in the Celebrations tab

### Phase 3: Daily Processing
- Edge function `process-celebration-rewards`
- pg_cron schedule (daily at 9:00 AM UTC)
- Logging and transaction records
- Low balance warnings

### Phase 4: Notifications (optional, later)
- Slack/Teams notification when someone gets a birthday/anniversary reward
- Email notification to the employee
- Low wallet balance alert to admin

## What Will NOT Change

- Existing monthly 100-point allocation (separate system)
- Peer-to-peer recognition flow
- Redemption shop or exchange rate logic
- Existing subscription billing

