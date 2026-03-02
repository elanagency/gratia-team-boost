

## Add Contact Button with Email Tooltip to Footer

### Changes

**`src/components/Footer.tsx`**
- Add a "Contact" button after FAQs in the nav
- On hover, show a tooltip/popover with `hello@grattia.com` and "Click to copy" text
- Clicking copies the email to clipboard and briefly shows a "Copied!" confirmation
- Use a simple `relative`/`absolute` positioned div with `group-hover` or state-based hover, styled to match the Figma screenshot (white rounded card with email + mail icon + "Click to copy" subtitle)
- Import `useState` for copied state and `Mail` icon from lucide-react

