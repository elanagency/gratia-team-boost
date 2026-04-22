

# Personal Stats — Show Point Sums Instead of Counts

## Change
In `src/components/dashboard/PersonalStatsCard.tsx`, change the `useQuery` for `personal-transaction-stats` to **sum the `points` column** instead of counting transactions.

### Query update
- **Received**: `SUM(points)` from `point_transactions` where `recipient_profile_id = me` AND `company_id = me`.
- **Sent**: `SUM(points)` from `point_transactions` where `sender_profile_id = me` AND `company_id = me`.
- Exclude self-transactions (`sender_profile_id != recipient_profile_id`) so the numbers reflect peer-to-peer recognition only, consistent with the rest of the app.

### Implementation note
Supabase JS doesn't expose a direct `SUM()` aggregate — fetch the `points` column for the relevant rows and reduce client-side:
```ts
const [{ data: receivedRows }, { data: sentRows }] = await Promise.all([
  supabase.from("point_transactions").select("points")
    .eq("recipient_profile_id", user.id).eq("company_id", companyId)
    .neq("sender_profile_id", user.id),
  supabase.from("point_transactions").select("points")
    .eq("sender_profile_id", user.id).eq("company_id", companyId)
    .neq("recipient_profile_id", user.id),
]);
const received = receivedRows?.reduce((s, r) => s + (r.points ?? 0), 0) ?? 0;
const sent = sentRows?.reduce((s, r) => s + (r.points ?? 0), 0) ?? 0;
```

Labels ("Received" / "Sent") stay the same — they now represent total points, matching the user's expectation.

## File modified
- `src/components/dashboard/PersonalStatsCard.tsx`

