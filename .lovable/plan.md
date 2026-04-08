

# Remove Stray "Upload CSV" Button

## Problem
The `CSVUploadDialog` component still renders a visible `DialogTrigger` button ("Upload CSV") at the bottom of the page. This is leftover from before the dropdown consolidation — the dialog is now controlled via state props (`externalOpen` / `onExternalOpenChange`), so the trigger button is redundant.

## Change

### `src/components/team/CSVUploadDialog.tsx`
- Remove the `<DialogTrigger>` block (lines 437-447) containing the "Upload CSV" button
- The dialog will continue to be controlled by the `externalOpen` and `onExternalOpenChange` props passed from `TeamManagementCard`

### Files modified
- `src/components/team/CSVUploadDialog.tsx`

