

## "+ Add Points" Interaction and Tagged Along Section

### 1. Replace "+ Add Points" with popover quick-select (RecognitionFeed.tsx)

**Current**: The "+ Add Points" button directly calls `handleQuickPoints` with a hardcoded 10 points.

**New behavior**:
- Restyle "+ Add Points" as a subtle outlined pill button with "+" prefix
- On click, show a small Popover (using Radix Popover) directly below the button with three pill buttons in a row: **+1**, **+5**, **+10**
- Each pill is a small bordered button; clicking one calls `handleQuickPoints` with that amount and closes the popover
- Add `showAddPoints` state (tracks which thread's popover is open by thread ID)

### 2. "Tagged along" section for comments/appreciations

**Current**: The `ThreadedRecognition` type already has a `comments` array (populated from "Quick appreciation:" transactions). The old "Appreciations" UI is gone.

**New behavior** — render below each feed item's reactions/add-points when `thread.comments.length > 0`:
- Label: "Tagged along:" in muted gray text (`text-muted-foreground text-xs`)
- Green badge showing total additional points from all comments (e.g. "+15 pts")
- Below that, a row of compact inline chips per commenter: avatar (20x20) + name + points (e.g. "Priya Sharma +5")
- Subtle horizontal divider (`<Separator />`) after the tagged-along section

### 3. Remove old appreciations section

The old "Appreciations" header/section from the previous build is already removed. Confirm no remnants remain.

### Files to modify
1. **`src/components/points/RecognitionFeed.tsx`** — add popover to "+ Add Points", render "Tagged along" section from `thread.comments`

