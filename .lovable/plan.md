

## Make "Contact" Button Click-to-Copy

Currently clicking the "Contact" text does nothing — you have to hover and then move your mouse up to the tooltip to click it. The fix is simple:

### Change in `src/components/Footer.tsx`
- Make the "Contact" button's `onClick` call `copyEmail()` directly, so clicking the word itself copies the email
- Keep the hover tooltip as a visual indicator showing what will be copied

