

# Fix Send Recognition — Use Pill Selections in Submit

## Root cause
The composer has two parallel input systems:
1. **Inline editor balloons** — typing `@name` and `+10` in the rich text creates `mentions[]` and `points[]`.
2. **New pill dropdowns** — Select teammate / Company value / Points (the chips below the message).

`handleSubmit` only reads system #1, so when a user fills the pills (as in the screenshot — Jessica + Teamwork + 10 pts) without typing `@` or `+` inline, submit fails with "Please add points using +" and nothing sends.

## Fix
Make the pills the **source of truth** for recipient + amount, and treat the inline balloons as a fallback. Company value gets persisted on the transaction.

### Changes in `src/components/points/GivePointsCard.tsx`

**1. Submit guards — use pills first**
- Recipients: build `recipientList` from `selectedTeammate` if set, else fall back to `mentions`. Require at least one.
- Points amount: use `Number(pointsInputValue)` if > 0, else fall back to summing `points[]`. Require > 0 and ≤ `monthlyPoints` × recipients.
- Update validation toasts to reference the pill UI ("Please select a teammate", "Please enter a points amount").

**2. Remove the auto-mention insertion when picking a teammate**
- In the teammate popover `onClick`, drop the `selectMention(member)` call. The pill alone represents the recipient — no need to also stuff a balloon into the editor (which causes the duplicate "Jessica Acevedo" we see in the screenshot).

**3. Pass the company value to the RPC**
- The `transfer_points_between_users` RPC already accepts a value column? Need to check. If it accepts a `value_id` / `company_value_id` parameter, pass `selectedValue?.id`. If not, append `[Value: <name>]` into `transfer_description` so it's preserved in the feed.
- Plan: append a small marker into `structuredMessage` (e.g. wrap with a `<span data-value-id="...">` tag) so the feed renderer can show the value tag, without DB schema change.

**4. Reset pills on success**
- After successful submit, clear `selectedTeammate`, `selectedValue`, and reset `pointsInputValue` to `"100"`.

**5. Keep inline `@` and `+` working**
- Don't remove the existing mention/point inline triggers — they remain as a power-user shortcut and as the fallback path.

## Files modified
- `src/components/points/GivePointsCard.tsx`

## Note
No DB migration needed. The company value gets embedded into the description HTML; existing feed rendering will display it as text. If the user later wants a structured value column on transactions, that would be a follow-up.

