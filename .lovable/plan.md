

# Fix HTML Description Rendering in Gift Card Modal

## Problem

Gift card descriptions from the Giftbit API contain HTML tags (`<p>`, `<a>`, `<br>`, etc.) that are currently displayed as raw text. For example, Amazon.com shows `<a href="https://www.amazon.com/gc-legal">www.amazon.com/gc-legal</a>` instead of a clickable link.

## Solution

Parse the HTML description and render it properly using `dangerouslySetInnerHTML` with basic sanitization to strip unsafe tags while preserving safe formatting tags like `<p>`, `<a>`, `<br>`, and `<strong>`.

## Changes

### File: `src/components/team/RewardInfo.tsx`

- Replace the plain text rendering of `reward.description` with a sanitized HTML renderer
- Create a simple sanitization function that strips all tags except safe ones (`p`, `a`, `br`, `strong`, `em`, `ul`, `li`)
- Ensure links open in a new tab (`target="_blank"`, `rel="noopener noreferrer"`)
- Style the rendered HTML with appropriate typography classes (e.g., links get underline styling, paragraphs get proper spacing)

### Technical Details

- Add a `sanitizeHtml` helper function that uses regex to whitelist safe tags and strip everything else
- For `<a>` tags, inject `target="_blank" rel="noopener noreferrer"` attributes
- Wrap the output in a styled `div` with `dangerouslySetInnerHTML`
- Apply Tailwind prose-like styles: `text-muted-foreground text-sm` with child element styling via a CSS class or inline approach

