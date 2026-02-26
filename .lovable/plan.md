

# Fix Recognition Card Height Shift

The card changes height between FormState and SuccessState because they have different content heights. Fix by giving the outer card container a fixed height matching the form state, so the success state centers within it without changing the card dimensions.

## Changes

**`src/components/RecognitionDemo.tsx`**:
- Add a fixed `min-h-[420px]` to the outer card container (line 90) so both states render within the same height
- The SuccessState already has `min-h-[380px]` but the FormState is taller — set a consistent height on the wrapper so neither state causes layout shift

