

# Hide "Add Points" Button on Self Recognitions

## Change
In `src/components/points/RecognitionFeed.tsx` (around lines 799–821), wrap the "Add Points" Popover so it only renders when the current user is **neither** the sender **nor** the recipient of the recognition:

```tsx
{user?.id !== thread.mainPost.sender_id &&
 user?.id !== thread.mainPost.recipient_id && (
  <Popover>
    {/* Add Points trigger + popover */}
  </Popover>
)}
```

This prevents the error caused by self-recognition (you can't give yourself points) and also hides it on posts you originally sent (giving "additional" points to a recognition you authored is also self-targeted).

## File modified
- `src/components/points/RecognitionFeed.tsx`

