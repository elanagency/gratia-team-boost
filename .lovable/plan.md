

## Add GIPHY GIF Picker to Recognition Composer

### Overview
Integrate GIPHY search into the recognition composer, adding a GIF button to the toolbar. Users can search/browse trending GIFs, select one, see a preview below the editor, and attach it to their recognition. The GIF displays in the recognition feed.

### Changes

**1. Add GIPHY API key as a Supabase secret**
- Store the user's GIPHY API key as `GIPHY_API_KEY`

**2. Create `giphy-search` edge function**
- Proxies requests to `api.giphy.com` (trending + search endpoints)
- Uses `GIPHY_API_KEY` secret server-side
- Returns simplified GIF objects: `{ id, url, previewUrl, width, height }`
- Add config entry in `supabase/config.toml` with `verify_jwt = false`

**3. Database: add `gif_url` column to `point_transactions`**
```sql
ALTER TABLE point_transactions ADD COLUMN gif_url TEXT;
```
No RLS changes needed (existing policies cover it).

**4. Modify `transfer_points_between_users` DB function**
- Add optional `transfer_gif_url TEXT DEFAULT NULL` parameter
- Insert `gif_url` into the `point_transactions` row alongside the existing fields

**5. Create `src/components/points/GiphyPicker.tsx`**
- Popover triggered by a "GIF" button
- Search input with debounce (300ms)
- Shows trending GIFs on open, search results when typing
- 2-column grid of GIF thumbnails (using `fixed_height_small` rendition)
- Click to select → returns `{ id, url, previewUrl }` → closes popover

**6. Update `src/components/points/GivePointsCard.tsx`**
- Add `selectedGif` state
- Add GIF button (with film icon) to toolbar next to Mention and Amount
- Show GIF preview with remove (✕) button between the editor and bottom bar
- Pass `gif_url` in the `transfer_points_between_users` RPC call
- Reset `selectedGif` on submit

**7. Update `src/components/points/GivePointsDialog.tsx`**
- Same GIF picker integration for the dialog version

**8. Update `src/components/points/RecognitionFeed.tsx`**
- When `gif_url` is present on a transaction, render an `<img>` below the message text
- Rounded corners, max-width constraint, lazy loading

**9. Update Slack/Teams notifications**
- Pass `gif_url` in the notification body
- In `send-slack-notification`: add an image block when `gif_url` is present
- In `send-teams-notification`: add an image element to the adaptive card

