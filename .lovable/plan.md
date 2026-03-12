

## Add GIPHY GIF Picker to Recognition Composer

### Overview
Add a GIF button to the recognition composer toolbar (next to "Mention" and "Amount") that opens a GIPHY search popover. When a GIF is selected, it appears as a preview below the text editor, attached to the recognition message. The GIF URL is stored alongside the message and displayed in the recognition feed.

### UI/UX Flow

```text
┌──────────────────────────────────────────┐
│  Give Recognition                        │
│  ─────────────────────────────────────── │
│  [@Mention] [+Amount] [🎬 GIF]          │  ← toolbar (GIF button added)
│  ─────────────────────────────────────── │
│  Thanks for the amazing workshop!        │
│  @Pedro +25                              │
│  ─────────────────────────────────────── │
│  ┌────────────────────┐                  │
│  │   [selected GIF]   │  ✕              │  ← GIF preview with remove button
│  │                    │                  │
│  └────────────────────┘                  │
│  ─────────────────────────────────────── │
│  25 pts × 1 person = 25 total    [Send] │
└──────────────────────────────────────────┘
```

When clicking the GIF button, a popover opens with:
- A search input (searches GIPHY API)
- Trending GIFs shown by default
- A grid of GIF results (thumbnails)
- Click a GIF to select it; popover closes and GIF preview appears below the editor

Only one GIF per recognition message. Selecting a new one replaces the previous.

### Technical Changes

**1. Store GIPHY API Key as a Supabase secret**
- Add the GIPHY API key as a secret (user has credentials)

**2. Create edge function `giphy-search/index.ts`**
- Proxies search requests to GIPHY API (keeps API key server-side)
- Endpoints: trending GIFs and search GIFs
- Returns simplified response (id, url, preview url, dimensions)

**3. Create `src/components/points/GiphyPicker.tsx`**
- Popover component with search input and GIF grid
- Calls the edge function for trending/search
- Debounced search input
- Returns selected GIF object `{ id, url, previewUrl, width, height }`

**4. Update `src/components/points/GivePointsCard.tsx`**
- Add `selectedGif` state
- Add GIF button to toolbar (next to Mention and Amount)
- Show GIF preview below the RichTextEditor with a remove (✕) button
- Pass `gif_url` in the submit payload (stored in `point_transactions.description` as structured data, or as a separate field)

**5. Database: add `gif_url` column to `point_transactions`**
- `ALTER TABLE point_transactions ADD COLUMN gif_url TEXT;`
- No RLS changes needed (existing policies cover it)

**6. Update `src/components/points/RecognitionFeed.tsx`**
- Render the GIF image below the recognition message text when `gif_url` is present

**7. Update Slack/Teams notifications**
- Include GIF URL as an image block in Slack notifications
- Include GIF as an image in Teams adaptive card

### What's Needed from You
- Confirm you'd like to proceed, and I'll ask you to add the GIPHY API key as a secret

