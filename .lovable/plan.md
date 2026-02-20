
# Remove Webhook Fallback from Teams Notifications

## Summary

Remove the "Or connect via Webhook URL (advanced)" collapsible section from the Teams notifications card, since OAuth is now the sole connection method.

## Changes

### 1. `src/components/settings/TeamsNotificationsCard.tsx`

- Remove the `Separator` and the entire webhook fallback section (lines 167-220): the collapsible button, the `TeamsWebhookSetupInstructions`, the webhook URL input, channel name input, and "Connect via Webhook" button.
- Remove unused state variables: `webhookUrl`, `channelName`, `showWebhookFallback` (lines 50-52).
- Remove the `handleWebhookConnect` function (lines 89-94).
- Remove unused imports: `Input`, `Label` (from the not-connected section -- they're not used elsewhere in that branch), `ChevronDown`, `ChevronUp`, and the `TeamsWebhookSetupInstructions` component import.
- Remove `connectTeams` and `isConnecting` from the hook destructure (lines 35, 40).

### 2. `src/components/settings/teams/TeamsWebhookSetupInstructions.tsx`

- Delete this file entirely -- it's no longer referenced.

### 3. `src/hooks/useTeamsIntegration.ts` (optional cleanup)

- The `connectTeams` mutation and `isConnecting` can remain in the hook for now since removing them isn't strictly necessary and keeps the hook backward-compatible. No changes needed here.

### What stays

- The OAuth "Connect to Microsoft Teams" button remains as the only connection option.
- The connected state UI (team/channel picker, test, disconnect, notification toggles) is unchanged.
- The webhook diagnostics panel for test results stays since it's used for the OAuth test flow too.
