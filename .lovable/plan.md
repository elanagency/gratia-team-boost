

## Refine RecognitionCarousel to match Figma

### Changes in `src/components/hero/RecognitionCarousel.tsx`

1. **Add blur to non-focused cards**: Apply `filter: blur(3px)` to cards where `isCenter` is false, and `filter: blur(0px)` to the focused card — animated via framer-motion's `animate` prop.

2. **Slow down the animation**: Increase the auto-cycle interval from `4000ms` to `6000ms` and the transition duration from `0.6s` to `1s` for a smoother, more relaxed feel.

3. **Smoother easing**: Update the cubic-bezier to a gentler curve like `[0.4, 0, 0.2, 1]`.

4. **Update card content to match Figma**: The Figma shows slightly different message content — update the card messages to match:
   - Card 1 (Sarah Jenkins → Alex Chen): "Thanks for jumping in on the Q3 presentation! Couldn't have done it without your data wizardry. 🚀"
   - Card 2 (Shomari Love → Priya Patel): "Huge shoutout for organizing the team offsite. It was exactly what we needed to recharge."
   - Card 3 (Elena Rodriguez → David Kim): "Amazing work debugging that critical issue in production. You saved the weekend! 🚀"

5. **Simplify reactions to just emojis** (no counts, matching Figma): Show just 2 emoji per card without counts.

