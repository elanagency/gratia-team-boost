

## Fix Send Recognition Card Height Shift

### Problem
The white card containing the "Send Recognition" demo uses `min-h-[420px]`, allowing its height to fluctuate slightly during animation steps (e.g., dropdown opening, points appearing), which shifts content below it.

### Change

**`src/components/RecognitionDemo.tsx` (line 92)**
- Change `min-h-[420px]` to `h-[420px]` so the card has a fixed height regardless of which animation step is active
- The inner content already fits within 420px, so nothing will be clipped

