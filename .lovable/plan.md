

## Redesign Recognition Composer and Recognition Feed

### 1. Redesign GivePointsCard (Recognition Composer)
**File: `src/components/points/GivePointsCard.tsx`**

- **Remove header**: Delete the `<CardHeader>` with Heart icon, "Give Recognition" title, and "Recognize team members with points" subtitle
- **Add "Points to give" indicator**: At the top of the card content, show `Points to give` in muted gray (#9996AA, Inter, 13px, weight 400) with a green badge showing the available points count
- **Add user avatar**: Show a 30×30 circular avatar to the left of the text input area. Placeholder text becomes "Recognize a teammate..."
- **Replace toolbar buttons**: Remove the `@ Mention` and `+ Amount` toolbar bar above the editor. Instead, add three pill/outlined buttons below the text area: "Select teammate", "Company value", "100 pts"
- **Replace bottom bar**: Remove GIF picker button. Add four small icons at bottom-left (emoji/smiley, image, grid/GIF). Replace the Send button with a gradient pill button (`linear-gradient(135deg, #7F2BFE, #FC5BFF)`, fully rounded, white text, send icon, opacity 0.5 when disabled, padding ~6.6px 14.9px 4.1px 15px)
- **Card styling**: Add `max-w-[680px]`, border, ~20px padding, flex column, 20px gap to next sibling

### 2. Redesign RecognitionFeed
**File: `src/components/points/RecognitionFeed.tsx`**

- **Replace header**: Remove `<CardHeader>` with MessageCircle icon and CardDescription. Replace with a flex row containing:
  - Left: "Recognition Feed" as plain text (#0F0533, Inter, 16px, font-weight 600, line-height 24px)
  - Right: Three tab buttons — "All" (active: dark bg, white text), "Received", "Sent" (inactive: #9996AA, Inter, 12px, weight 500)
- **Add tab state**: Add `activeTab` state (`'all' | 'received' | 'sent'`), filter transactions accordingly (received = user is recipient, sent = user is sender)
- **Restyle feed items**: For each recognition:
  - Avatar on the left (keep existing)
  - Header line: `[Sender] recognized [Recipient] · [time]` format
  - Below header: colored company value pill badge + green points badge (e.g. "Teamwork" + "+50 pts")
  - Message text below badges
  - Emoji reaction row below message (🎉 12, 💚 8, 🔥 5) — use placeholder/mock data for now since reactions aren't stored yet
  - "+ Add Points" link/button below reactions
  - Divider (separator) between items
- **Remove**: Clock icon from timestamps, "gave...to" phrasing, old quick-point heart buttons, CardDescription subtitle

### 3. Update Dashboard gap
**File: `src/pages/admin/Dashboard.tsx`**
- Ensure 20px gap between GivePointsCard and RecognitionFeed in the left column (`gap-5`)

### Files to modify
1. `src/components/points/GivePointsCard.tsx` — major UI restructure
2. `src/components/points/RecognitionFeed.tsx` — major UI restructure  
3. `src/pages/admin/Dashboard.tsx` — minor gap adjustment

