

## Update Hero Section Avatars with Memoji Images

The uploaded images are labeled "Hero Section Avatars" for three senders in the `RecognitionCarousel`:

| Name | Uploaded File |
|------|--------------|
| Shomari Love | `image_2.png` |
| Elena Rodriguez | `image_4.png` |
| Sarah Jenkins | `image_5.png` |

### Changes

**Step 1: Copy avatar images to `src/assets/avatars/`**
- `user-uploads://image_2.png` → `src/assets/avatars/shomari-love.png`
- `user-uploads://image_4.png` → `src/assets/avatars/elena-rodriguez.png`
- `user-uploads://image_5.png` → `src/assets/avatars/sarah-jenkins.png`

**Step 2: Update `src/components/hero/RecognitionCarousel.tsx`**
- Import the three avatar images
- Add an optional `senderAvatar` field to the `RecognitionCard` interface
- Set avatar paths on each card's data
- Replace the colored initials `<div>` with an `<img>` tag when `senderAvatar` is present, keeping the same 36px rounded-full sizing

