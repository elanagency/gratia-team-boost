

# Enable Image Attachments in Recognition Composer

## Goal
Replace the "Image attachments coming soon!" placeholder with a working image upload that attaches an image to a recognition post and displays it in the feed.

## Approach

### 1. Storage
Reuse the existing public `avatars` bucket pattern by adding a new public `recognition-images` bucket via migration. Path convention: `{company_id}/{user_id}/{timestamp}-{filename}`.

RLS policies on `storage.objects`:
- **SELECT**: public (bucket is public, images render in feed without signed URLs).
- **INSERT**: authenticated users, only into a path beginning with their own `auth.uid()`.
- **DELETE**: owner only.

### 2. Database
The `point_transactions` table already has a `gif_url` column used for Giphy attachments. Add a parallel `image_url text` column via migration so images and GIFs can coexist (a recognition can have either, not both, enforced in UI).

The `transfer_points_between_users` RPC currently accepts `transfer_gif_url`. Extend it with an optional `transfer_image_url text default null` parameter and insert it into the new column. (Adding a parameter at the end is backward-compatible — existing callers keep working.)

### 3. UI — `src/components/points/GivePointsCard.tsx`
- Replace the toast placeholder on the image icon with a hidden `<input type="file" accept="image/jpeg,image/png,image/webp">` triggered by the icon button.
- On select: validate (max 5MB, image mime), upload to `recognition-images` bucket, get `publicUrl`, store in new `selectedImage` state.
- Show preview thumbnail above the composer (same area used for GIF preview) with an X to remove.
- Disable the GIF button while an image is attached, and vice versa (mutual exclusion).
- On submit: pass `transfer_image_url` to the RPC alongside existing args. Reset state on success.

### 4. UI — `src/components/points/RecognitionFeed.tsx`
Render `transaction.image_url` in the feed card the same way `gif_url` is rendered (rounded image below the description, max-height ~300px, click to open full size in a new tab).

### 5. Types
After the migration runs, `src/integrations/supabase/types.ts` regenerates automatically — no manual edit.

## Files modified
- New migration: add `recognition-images` storage bucket + RLS, add `point_transactions.image_url` column, update `transfer_points_between_users` RPC signature.
- `src/components/points/GivePointsCard.tsx` — wire up upload, preview, submit.
- `src/components/points/RecognitionFeed.tsx` — render attached image in feed.

## Note
The existing recognition composer button hover memory (`hover:bg-muted/50`) is preserved — only the click handler changes.

