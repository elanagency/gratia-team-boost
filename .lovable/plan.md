

## Final CTA Section — Animation & Text Wrapping Fix

### Changes — `src/components/FinalCTA.tsx`

1. **Add Framer Motion scroll animations**: Import `motion` from framer-motion. Wrap the heading, body text, and buttons in `motion.div`/`motion.h2`/`motion.p` with `initial={{ opacity: 0, y: 20 }}`, `whileInView={{ opacity: 1, y: 0 }}`, staggered delays, matching the pattern used across other landing page sections.

2. **Fix text wrapping**: Widen the container from `max-w-3xl` to `max-w-4xl` so the first body line ("Someone stayed late. Someone saved a project. None of that was recognized today.") fits on a single line, matching the Figma.

