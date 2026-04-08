

# Match GIF Button Hover to Emoji Button Style

## Problem
The GIF button in the recognition composer uses `Button variant="outline"` which gives it a pink/accent hover color. The emoji and image buttons next to it use a simple `hover:bg-muted/50` light gray hover.

## Change

### `src/components/points/GiphyPicker.tsx`
- Replace the `Button variant="outline"` trigger with a plain `button` element styled identically to the emoji/image buttons: `p-1.5 rounded-md hover:bg-muted/50 text-muted-foreground transition-colors`
- Keep the `Film` icon and "GIF" text, just change the wrapper from a shadcn Button to a plain styled button

### Files modified
- `src/components/points/GiphyPicker.tsx`

