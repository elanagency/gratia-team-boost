

# Stripe-Style Custom Date Range Picker

## Goal
Replace the current single-month range picker with a Stripe-style two-month calendar that has explicit Start / End input fields above, clear visual feedback for which date is being picked, and an Apply / Clear action row.

## New layout

```text
┌─────────────────────────────────────────────────────────────────┐
│ Last 7 days     Start [ 03 / 01 / 2026 ]   End [ 03 / 31 / 2026 ]│
│ Last 30 days                                                     │
│ Last 90 days   <  February 2026         March 2026  >            │
│ This month     Su Mo Tu We Th Fr Sa   Su Mo Tu We Th Fr Sa       │
│ Last month      1  2  3  4  5  6  7    1  2  3  4  5  6  7       │
│ ...             ...                    ...                       │
│                                                                  │
│                                              [ Clear ]  [Apply]  │
└─────────────────────────────────────────────────────────────────┘
```

## Behaviour
- **Start / End inputs** above the calendar show the currently picked dates as `MM / DD / YYYY`. Each is editable; valid input updates the range. The currently active field (the one that the next click will set) gets a light purple ring/border.
- **Two months side by side** (`numberOfMonths={2}`) instead of one.
- **Click flow**:
  1. First click sets the **start** date and switches active field to End.
  2. Second click on a later date sets the **end** date.
  3. Clicking a date earlier than the current start resets start to that date and waits for a new end.
  4. The user can also click directly into the Start or End input to choose which they're editing — the next calendar click updates that field.
- **Visual styles** (reuse existing app gradient, no new colors):
  - Range endpoints: solid gradient circle `linear-gradient(135deg,#7F2BFE,#FC5BFF)`, white text.
  - In-range days: `bg-purple-100` (already in `calendar.tsx`).
  - Active input field: ring/border `#7F2BFE` + light purple background tint.
- **Action row** at the bottom-right:
  - **Clear** — resets the draft range (ghost button, gray border, hover gray).
  - **Apply** — commits the draft to `dateRange` and closes the popover. Gradient background, white text. Disabled until both Start and End are valid.
- **Draft state**: changes inside the popover are local until Apply is clicked, so the dashboard doesn't refetch on every partial click.
- **Presets** (Last 7 / 30 / 90 days, This month, Last month) stay in the left column. Clicking a preset fills both inputs with its computed range but does **not** auto-close — the user still confirms with Apply (matches Stripe).

## Files to modify

### 1. `src/components/analytics/AnalyticsFilters.tsx`
- Replace the popover content with the new layout.
- Add local state: `draftStart`, `draftEnd`, `activeField: 'start' | 'end'`.
- Add two `<input>` fields formatted as `MM / DD / YYYY` with parsing/validation (using `date-fns` `parse` + `isValid`).
- Switch `<CalendarComponent>` to `numberOfMonths={2}` and wire `onSelect` so it writes into the active field, then advances `activeField`.
- Add Clear / Apply buttons. Apply calls `onDateRangeChange({ start: draftStart, end: draftEnd })` and closes the popover.
- Initialize draft state from current `dateRange` whenever the popover opens.

### 2. `src/components/ui/calendar.tsx`
- No structural change needed — existing `day_selected` (gradient) and `day_range_middle` (`bg-purple-100`) already match the screenshot.
- Minor tweak: ensure `day_range_start` / `day_range_end` get the gradient treatment (currently inherits from `day_selected`, which is fine — verify and add explicit class only if needed).

### Files modified
- `src/components/analytics/AnalyticsFilters.tsx`
- `src/components/ui/calendar.tsx` (only if endpoint styling needs explicit classes)

