

# TheSolution Section Refinements

## Changes

1. **Copy Grattia symbol** to `src/assets/grattia-symbol.png` and import it in TheSolution.tsx, replacing the `<Sparkles>` icon.

2. **Update pulse-shadow animation in `tailwind.config.ts`**:
   - Make it one-directional (expand out only, then reset) instead of pulsing in and out
   - Slow it down significantly (~4-5s duration)
   - Keyframes: `0%` starts with no shadow, expands outward through the cycle, then resets at 100%

3. **Update `src/components/TheSolution.tsx`**:
   - Replace `<Sparkles>` with the imported Grattia symbol image (~16px)

### Animation keyframes change
```
'pulse-shadow': {
  '0%': { boxShadow: '0 0 0 0 rgba(94, 44, 165, 0.35)' },
  '70%': { boxShadow: '0 0 0 14px rgba(94, 44, 165, 0)' },
  '100%': { boxShadow: '0 0 0 0 rgba(94, 44, 165, 0)' },
}
// Duration: 4s
```

