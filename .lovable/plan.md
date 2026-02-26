

## Link "Book a Demo" buttons to Calendly

Update both "Book a Demo" buttons to open `https://calendly.com/pedro-grattia/30min` in a new tab.

### Changes

1. **`src/components/FinalCTA.tsx`** — Change the "Book a Demo" `<a>` href to the Calendly URL, add `target="_blank"` and `rel="noopener noreferrer"`
2. **`src/components/Hero.tsx`** — Find the "Book a Demo" button and apply the same Calendly link with `target="_blank"`

