

## Fix Recognition Feed Fine Details to Match Figma

### Changes needed in `src/components/points/RecognitionFeed.tsx`

Based on the Figma screenshots, several styling details are off:

### 1. Points badge — too bold
- **Current**: `font-semibold` (600), `bg-green-100 text-green-700`
- **Figma**: Inter 12px, weight **500**, color `#15803D`, bg `#DCFCE7`
- Fix line 619: change `font-semibold` to `font-medium`

### 2. Emoji reactions — need pill background
- **Current**: No background, plain text buttons
- **Figma**: Each reaction sits inside a pill with `bg: #F5F5F7`, large border-radius, `height: 21.75px`, `padding: 1.875px 7.5px`, `gap: 3.75px`. Reaction count text is `color: #0F0533`, 12px, weight 500
- Fix lines 642-649: Add `bg-[#F5F5F7] rounded-full px-2 py-0.5` to each reaction button, update text color to `#0F0533`

### 3. "+ Add Points" button — too rounded
- **Current**: `rounded-full` (fully circular ends)
- **Figma**: `border-radius: 9.375px`, `border: 1px solid #E8E6F0`, text `color: #9996AA`, Inter 12px weight 500
- Fix line 654: Change `rounded-full` to `rounded-[9.375px]`, border color to `border-[#E8E6F0]`

### 4. Company value badge padding
- **Figma**: padding `1.88px 9.375px`, height `21.75px`
- Fix lines 610-611: adjust padding to match

### File to modify
1. `src/components/points/RecognitionFeed.tsx` — lines 619, 642-649, 654, 610-611

