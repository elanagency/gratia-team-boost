

# Recognition Composer Dropdowns — Match Figma

## Goal
Restyle the three composer dropdowns (Select teammate, Company value, points) in `GivePointsCard.tsx` to match the screenshots: drop **down** (not up), simple gray border, purple-bordered search input, purple highlight on the selected item.

## Spec (from screenshots)

### Trigger pill (closed)
- Border: 1px `#E8E6F0` gray (current). When **open**: 1.5px `#7F2BFE` purple border.
- Placeholder text color: `#9996AA` gray. Selected text: `#0F0533`.

### Popover panel
- Open **downward** only — set `side="bottom"` and `align="start"` on `PopoverContent`.
- Width matches trigger (~180px for teammate/value, ~140px for points).
- White bg, 1px `#E8E6F0` border, rounded `13.375px`, soft shadow, padding `8px`.

### Search input (inside popover)
- Full-width, 36px height, rounded `8px`.
- Border: 1.5px `#7F2BFE` purple (always — matches "highlighted search bar").
- Placeholder "Search..." in gray `#9996AA`.

### Option list
- Items: 36px row, 14px Inter, color `#0F0533`, padding `0 12px`, rounded `8px`.
- Hover: bg `#F5F5F7`.
- **Selected** item: bg `#F3EBFF` (light purple), text `#7F2BFE` (purple), font-weight 500. Matches screenshots 2 & 3 (Marcus Johnson highlighted, 100 pts highlighted).
- No checkmark icon — just color highlight.

## Implementation

In `src/components/points/GivePointsCard.tsx`:

1. **Open direction** — on all three `<PopoverContent>` set `side="bottom"` and `align="start"` so they consistently drop down (currently they may flip up when near viewport edge).

2. **Trigger open state** — track `open` for each popover (controlled `Popover open onOpenChange`) and apply `border-[1.5px] border-[#7F2BFE]` when open, `border border-[#E8E6F0]` otherwise.

3. **Search inputs** — each popover already has a search `Input`. Restyle to:
   ```
   className="h-9 rounded-lg border-[1.5px] border-[#7F2BFE] focus-visible:ring-0 focus-visible:border-[#7F2BFE] placeholder:text-[#9996AA]"
   ```

4. **Option items** — replace current button styles with:
   - Base: `flex items-center h-9 px-3 rounded-lg text-sm text-[#0F0533] hover:bg-[#F5F5F7] cursor-pointer w-full text-left`
   - Selected (when value matches current selection): `bg-[#F3EBFF] text-[#7F2BFE] font-medium hover:bg-[#F3EBFF]`
   - Remove any existing checkmark/avatar prefix from the row to match the clean text-only look in the screenshots.

5. **Points popover** — same treatment; selected pts row gets the purple highlight.

## File modified
- `src/components/points/GivePointsCard.tsx`

