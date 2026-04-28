# Points Dropdown Redesign

Restyle the points pill dropdown in the recognition composer (`GivePointsCard`) to match the screenshot.

## New layout (top to bottom)
1. **Search** input (purple-bordered, placeholder "Search...") — type-ahead filters the preset list; numeric input.
2. Thin divider line under the search.
3. **Three preset rows**: `5 pts`, `10 pts`, `25 pts`. The currently selected value is shown in purple text (e.g. `100 pts` in the mock). Hover → light grey row.
4. **Custom amount row** at the bottom: a small text input (placeholder "Custom amount") with a purple **Set** pill button to its right. Pressing Set (or Enter) commits the typed value as the selected points.

## Behavior
- Selecting a preset closes the dropdown and updates the points pill label.
- Typing in Custom amount + Set closes the dropdown and uses that value (must be > 0).
- The Search input filters the 3 presets when the user types numeric digits (e.g. typing `2` keeps `25 pts`); the Custom amount row stays visible regardless.
- Selected value is highlighted in `#7F2BFE` text (no background fill), matching the mock — slight tweak from current pink-purple background.

## File touched
- `src/components/points/GivePointsCard.tsx` — replace lines ~664–728 (the points `<Popover>` block):
  - Replace preset array `[10, 20, 25, 50, 100, 200, 500]` with `[5, 10, 25]`.
  - Add a divider between the Search input and the preset list.
  - Add the Custom amount row (Input + Set button) at the bottom of the popover.
  - Update the selected-row style to purple text only (no purple bg fill) per the mock.

No business logic, backend, or other components affected.
