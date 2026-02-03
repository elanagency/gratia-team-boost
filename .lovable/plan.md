

# Fix Analytics Recognition Metrics to Exclude Redemptions

## Problem

When a user redeems points, the system creates a negative point transaction in the `point_transactions` table. The analytics queries for "Recognition Received" and "Recognition Sent" are fetching ALL transactions including these redemption records, causing:

- **Recognition Sent**: Shows negative values (e.g., -370 points, -500 pts for Pedro Olinger)
- **Recognition Received**: Shows negative values (e.g., -370 points, -570 pts for Pedro Olinger)

## Root Cause

Database evidence shows redemptions are stored as:
- **Negative points** (e.g., `points: -600`, `points: -300`)
- **Self-transactions** (sender_profile_id = recipient_profile_id)
- **Description** contains "Redeemed" text

The `fetchTransactionData` and `fetchTransactionTotal` functions in `useAnalyticsData.ts` have **no filter** to exclude these redemption records.

## Solution

Add filters to the transaction queries to:
1. **Only include positive points** (`points > 0`)
2. **Exclude self-transactions** (`sender_profile_id != recipient_profile_id`) as an additional safety measure

This aligns with the existing leaderboard logic documented in the codebase memory.

---

## Technical Implementation

### File: `src/hooks/useAnalyticsData.ts`

#### Change 1: `fetchTransactionTotal` function (lines 186-203)

Add filter for positive points only:

```typescript
async function fetchTransactionTotal(
  companyId: string,
  startDate: Date,
  endDate: Date,
  profileType: 'sender' | 'recipient'
): Promise<number> {
  const { data, error } = await supabase
    .from('point_transactions')
    .select('points')
    .eq('company_id', companyId)
    .gt('points', 0)  // Only positive transactions (excludes redemptions)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  if (error) throw error;
  return (data || []).reduce((sum, tx) => sum + tx.points, 0);
}
```

#### Change 2: `fetchTransactionData` function (lines 264-301)

Add filter for positive points only:

```typescript
async function fetchTransactionData(
  companyId: string,
  startDate: Date,
  endDate: Date,
  segmentBy: SegmentType,
  granularity: GranularityType,
  profileType: 'sender' | 'recipient'
): Promise<Omit<AnalyticsData, 'trend'>> {
  const fk = profileType === 'sender' 
    ? 'point_transactions_sender_profile_id_fkey' 
    : 'point_transactions_recipient_profile_id_fkey';
  
  const { data: transactions, error } = await supabase
    .from('point_transactions')
    .select(`
      id,
      points,
      created_at,
      ${profileType}_profile_id,
      profiles!${fk} (
        first_name,
        last_name,
        department_id,
        departments (name)
      )
    `)
    .eq('company_id', companyId)
    .gt('points', 0)  // Only positive transactions (excludes redemptions)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: true });

  // ... rest of function
}
```

#### Change 3: `fetchEngagementTotal` function (lines 206-228)

Add filter for positive points to engagement calculations:

```typescript
async function fetchEngagementTotal(
  companyId: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  const [membersResult, txResult] = await Promise.all([
    supabase.from('profiles').select('id').eq('company_id', companyId).eq('status', 'active'),
    supabase.from('point_transactions')
      .select('sender_profile_id, recipient_profile_id')
      .eq('company_id', companyId)
      .gt('points', 0)  // Only positive transactions
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString()),
  ]);
  // ... rest of function
}
```

#### Change 4: `fetchEngagementData` function (lines 320-327)

Add filter for positive points:

```typescript
const { data: transactions, error: txError } = await supabase
  .from('point_transactions')
  .select('sender_profile_id, recipient_profile_id, created_at')
  .eq('company_id', companyId)
  .gt('points', 0)  // Only positive transactions
  .gte('created_at', startDate.toISOString())
  .lte('created_at', endDate.toISOString())
  .order('created_at', { ascending: true });
```

---

## Summary of Changes

| Location | Change |
|----------|--------|
| `fetchTransactionTotal` | Add `.gt('points', 0)` filter |
| `fetchTransactionData` | Add `.gt('points', 0)` filter |
| `fetchEngagementTotal` | Add `.gt('points', 0)` filter |
| `fetchEngagementData` | Add `.gt('points', 0)` filter |

---

## Expected Result

After this fix:
- **Recognition Received**: Only shows positive points from peer recognition (never negative)
- **Recognition Sent**: Only shows positive points from peer recognition (never negative)
- **Engagement Rate**: Only counts participants in actual peer recognition, not redemptions
- **Redemptions**: Continues to work correctly from the separate `redemptions` table

