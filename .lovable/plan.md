

# New "Recognition Demo" Section

## Design from Figma

- **Background**: Fades from `#F5F3FF` (continuing from TheSolution) back to white
- **Layout**: Two-column — left side has heading + subtitle, right side has animated recognition card
- **Left column**:
  - Heading: "Recognition that becomes part of how your team works" — Poppins, ~48px bold, `#0F0D33`
  - Subtitle: "When recognition is easy, it becomes a habit. Grattia makes sure every great moment gets acknowledged, not just the loudest ones." — ~18px, `#0F0D33`/80%
- **Right column**: Animated "Send Recognition" card (white, rounded, subtle shadow) that loops through steps

### Animation sequence (looping):
1. **Blank form**: "Send Recognition" header, "Select teammate..." dropdown, points chips (+10, +50, +100 — none selected), empty message textarea, dark "Send Recognition" button
2. **Select teammate**: Dropdown opens, shows search + "Elena Rodriguez" and "Sarah Miller", selects Elena
3. **Select points**: +50 chip becomes selected (purple fill)
4. **Type message**: Types "Great work leading the sprint review! The client loved the new features."
5. **Press Send**: Button animates
6. **Loading**: Brief spinner/loading state
7. **Success**: Green check icon, "Recognition Sent!", "Elena will get a notification in Slack."
8. **Pause, then reset to step 1**

### Card design details:
- White bg, rounded-2xl, subtle shadow
- Two small dots (green/gray) in top-right corner
- "TO" label, select dropdown with purple border when active
- "POINTS" label with +10/+50/+100 pill buttons
- "MESSAGE" label with textarea
- Dark navy "Send Recognition" button with send icon

## Changes

1. **Create `src/components/RecognitionDemo.tsx`** — New section component with:
   - `bg-gradient-to-b from-[#F5F3FF] to-white` background
   - Two-column layout (left: text, right: animated card)
   - Self-contained animation loop for the recognition card with all steps above

2. **Update `src/pages/Index.tsx`** — Insert `<RecognitionDemo />` between `<TheSolution />` and the dark `<div>` block

