

## Fix Blurred Cards Cutoff and Smoother Scrolling

### Problems
1. **Top card cut off**: The container has `overflow-hidden` and `h-[480px]`, but the top card at `y: -170` gets clipped
2. **Animation not smooth enough**: Current transition is `duration: 0.8` with a standard ease — needs to be slower and use a smoother easing curve

### Changes

**`src/components/hero/RecognitionCarousel.tsx`**

1. **Increase container height** from `h-[480px]` to `h-[580px]` to give more room for the top and bottom blurred cards to render without clipping

2. **Increase fade gradient height** from `h-20` to `h-28` so the larger visible area still fades nicely at edges

3. **Slow down the animation transition** from `duration: 0.8` to `duration: 1.4` with a gentler cubic bezier curve `[0.25, 0.1, 0.25, 1]` for a much smoother, more natural feel

4. **Adjust exit animation** to use the same slower duration and smoother curve

