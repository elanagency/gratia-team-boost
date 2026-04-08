

# Give Recognition Button → Navigate & Focus

## Problem
The sidebar "Give Recognition" button currently opens a `GivePointsDialog`. It should instead navigate to `/dashboard` and focus the recognition composer input.

## Approach
1. **DashboardSidebar**: Replace the `GivePointsDialog` wrapper with a plain button that uses `useNavigate` to go to `/dashboard` and dispatches a custom event (e.g. `focus-recognition-composer`) to signal the composer to focus.
2. **GivePointsCard**: Listen for that custom event and call `editorRef.current?.focus()` when received.

## Changes

### `src/components/dashboard/DashboardSidebar.tsx`
- Remove `GivePointsDialog` import
- Add `useNavigate` from react-router-dom
- Replace `<GivePointsDialog trigger={giveRecognitionTrigger} />` with the button directly, adding an `onClick` that navigates to `/dashboard` and dispatches `window.dispatchEvent(new Event("focus-recognition-composer"))`
- Close mobile sheet on click

### `src/components/points/GivePointsCard.tsx`
- Add a `useEffect` that listens for the `"focus-recognition-composer"` custom event
- On event, call `editorRef.current?.focus()` (with a small `setTimeout` to ensure the component is mounted/visible after navigation)

### Files modified
- `src/components/dashboard/DashboardSidebar.tsx`
- `src/components/points/GivePointsCard.tsx`

