

# Remove Notification Types from Slack Integration Card

## Change
In `src/components/settings/SlackNotificationsCard.tsx`, remove the entire "Notification types" section (the toggles for recognition notifications, point allocation alerts, team milestones, and weekly/monthly summaries) along with its related state, handlers, and the `updateNotificationSettings` mutation usage.

The Slack card will retain:
- Connection status / Connect button
- Workspace info
- Default channel selector
- Disconnect button

## File modified
- `src/components/settings/SlackNotificationsCard.tsx`

## Note
The `updateNotificationSettings` mutation in `useSlackIntegration.ts` and the `notification_settings` column in the DB are left intact (still consumed by `send-slack-notification` edge function as a default-allow if keys missing — no behavior change). Only the UI is removed.

