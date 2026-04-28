# Render Company Value as a Purple Pill in the Recognition Feed

## Problem
Recognitions in the feed currently show the raw token `[Value: Teamwork]` inline in the message text, with no purple pill next to the green points pill. The pill code already exists in `RecognitionFeed.tsx`, but it only renders when `company_value_id` is populated on the transaction row — and the `transfer_points_between_users` RPC doesn't accept that column, so it's always NULL. The value is currently only embedded as a `<span class="value-tag" data-value-id="...">[Value: Name]</span>` token inside the description.

## Fix (UI only)
In `src/components/points/RecognitionFeed.tsx`:

1. **Extract the value from the description token** when `company_value_name` from the joined column is missing. Parse the `<span class="value-tag" data-value-id="UUID">[Value: NAME]</span>` HTML (or the plain `[Value: NAME]` fallback) during transaction formatting. Use the extracted name to populate `company_value_name` on the formatted transaction.

2. **Strip the value token from the displayed message text** so users no longer see "Great [Value: Teamwork]". Update `parseStructuredMessage` to remove `.value-tag` / `[data-value-id]` elements (HTML branch) and the `[Value: ...]` substring (plain-text branch) before computing `cleanText`.

3. **Force the pill to use the brand purple** for every value, regardless of any color stored on the value record. Update the existing badge JSX (lines 702-714) to use:
   - background `#F3EBFF` (light purple)
   - text `#7F2BFE` (solid purple)
   
   Drop the `company_value_color` styling — the user wants the same color for every value.

## Files
- `src/components/points/RecognitionFeed.tsx` — only file changed.

## Notes
- No DB, RPC, or business-logic changes. The value is already saved (inside the description); we're just surfacing it correctly in the feed.
- The pill matches the screenshot reference: light purple background, solid purple text, sitting next to the existing green `+N pts` badge.
