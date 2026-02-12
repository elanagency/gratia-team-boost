

# Add "Redemptions Are Final" Warning to Gift Card Redemption

## Overview

Add a clear warning message near the redeem button in the gift card redemption flow, informing users that all redemptions are final and non-refundable.

## Changes

### File: `src/components/team/RewardInfo.tsx`

- Add a warning alert just above the "Redeem Gift Card" button
- Use the existing `Alert` component with an `AlertCircle` icon (already imported)
- Text: "All redemptions are final and non-refundable."
- Styled with a subtle amber/warning tone to draw attention without being alarming
- Only visible once an amount is selected, so it appears at the decision point

