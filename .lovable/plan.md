## Goal

Improve the Redeem Gift Card modal inputs so the user always knows what they're entering.

## Changes (in `src/components/team/GiftCardModal.tsx`)

1. **Persistent labels inside inputs**
   - Switch both inputs from `type="number"` to `type="text"` (inputMode numeric/decimal) so we can render formatted strings.
   - Dollar input: always show a `$` prefix (absolute-positioned inside the input, with left padding on the input).
   - Points input: always show a ` points` suffix (absolute-positioned at right, with right padding on the input).
   - Placeholders updated to `0.00` and `0` respectively (the `$` and `points` labels are always visible separately, not as part of placeholder).

2. **Thousands separators**
   - Display values formatted with commas (e.g. `1,000`, `12,500`).
   - On change, strip commas before parsing/storing.

3. **Two decimal places for dollars**
   - While typing, allow free decimal entry (don't reformat mid-typing — would break caret).
   - On blur of the dollar input, reformat to exactly two decimals (e.g. `0.5` → `0.50`, `12` → `12.00`).
   - When the dollar value is computed from the points input, format to two decimals immediately.

4. **Bidirectional sync preserved**
   - `handleDollarChange`: parse stripped value, update points (integer, with commas on display).
   - `handlePointsChange`: parse stripped value, update dollar (number with commas; format to 2 decimals on display).
   - Internal state stores raw numeric strings; a separate display formatter handles commas/decimals.

## Out of scope

- No changes to redemption logic, validation thresholds, exchange rate, or backend calls.
- No styling overhaul beyond the prefix/suffix adornments needed to display `$` and `points`.
