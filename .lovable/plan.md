

## Add Slack Feed Section Avatars

The Slack screenshot labels these as "Slack Feature Avatars" for the 6 senders in `SlackFeedSection`:

| Name | Uploaded File | Description |
|------|--------------|-------------|
| David | `image_3.png` | Bald man with glasses/beard |
| Mike | `image_6.png` | Man in suit waving |
| Nour | `image_7.png` | Woman in pink hijab |
| Lucas | `image_8.png` | Boy in blue hoodie |
| James | `image_9.png` | Person in yellow top |
| Emma | `image_10.png` | Redhead making heart |

### Changes

**Step 1: Copy 6 avatar images to `src/assets/avatars/`**
- `image_3.png` → `src/assets/avatars/david.png`
- `image_6.png` → `src/assets/avatars/mike.png`
- `image_7.png` → `src/assets/avatars/nour.png`
- `image_8.png` → `src/assets/avatars/lucas.png`
- `image_9.png` → `src/assets/avatars/james.png`
- `image_10.png` → `src/assets/avatars/emma.png`

**Step 2: Update `src/components/SlackFeedSection.tsx`**
- Import all 6 avatar images
- Add an optional `senderAvatar` field to each entry in `RECOGNITION_ENTRIES`
- In the `RecognitionEntry` component, render an `<img>` with the avatar instead of the colored initials `<div>` when `senderAvatar` is present (same `w-9 h-9 rounded-lg` sizing)

