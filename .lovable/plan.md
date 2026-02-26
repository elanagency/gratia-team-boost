

# Landing Page Section 1 (Header + Hero) Redesign

## Design Analysis from Figma

**Major shift**: Dark purple background to white/light background. Completely new visual direction.

### Header Changes
- White background (not dark purple with blur)
- Nav links: Features, Pricing, FAQs (currently Features, How It Works, Pricing)
- "Log In" text link + "Sign Up" purple rounded button (similar to current but on white bg)
- Logo with sparkle icon on left

### Hero Changes
- **Background**: White, no animated gradient blobs
- **Left column**:
  - Title: "Recognition Shouldn't Be Reserved for Review Season" in dark text (#0F0D33), Poppins 64px, weight 800, line-height 115%
  - Subtitle: Gray text, same copy as Figma
  - Two buttons: "Get Started" (gradient pink-to-purple pill) + "Book a Demo" (outlined pill with border)
- **Right column**: Replaces `ProductAnimation` with a vertically scrolling recognition feed
  - 3 recognition cards that auto-rotate/scroll infinitely
  - Each card: avatar, "[Name] recognized [Name]", points badge (+50/+75/+100), category tag (TEAMWORK/CULTURE/EXCELLENCE), quote message, emoji reactions
  - Cards have white bg, rounded corners, subtle shadow
  - One card is prominent (center), adjacent cards are partially visible and faded

## Implementation Steps

### 1. Update `Header.tsx`
- Change background from `bg-[#0F0533]/80 backdrop-blur-lg` to `bg-white shadow-sm`
- Update text colors to dark (#0F0D33)
- Change nav links to: Features, Pricing, FAQs
- Update button styles for light background
- Keep Login/SignUp routing logic

### 2. Create `RecognitionCarousel.tsx` (new component)
- Static recognition card data (3 cards matching Figma content)
- Auto-scrolling vertical carousel using framer-motion
- Each card renders: avatar placeholder, recognizer/recipient names, points badge, category tag, message, emoji reactions
- Smooth infinite vertical scroll animation

### 3. Rewrite `Hero.tsx`
- Remove dark background, animated gradient blobs
- White/light background
- Left column: new title text, subtitle, two CTA buttons (Get Started gradient + Book a Demo outlined)
- Right column: `RecognitionCarousel` component instead of `ProductAnimation`
- Typography: Poppins 64px/800/115% for heading, ~18px gray for subtitle

### 4. Update `Index.tsx`
- Change background from `#0F0533` to white for the hero section area
- Text color adjustments for the light theme (only for this section; other sections may remain dark for now)

### 5. Minor CSS updates in `index.css`
- No major changes needed; component-level styles will handle the light theme

## Technical Details

| File | Action |
|------|--------|
| `src/components/Header.tsx` | Restyle for white background, update nav links |
| `src/components/hero/RecognitionCarousel.tsx` | New - scrolling recognition card feed |
| `src/components/Hero.tsx` | Full rewrite - light bg, new copy, new layout |
| `src/pages/Index.tsx` | Adjust wrapper styling for light hero section |

Recognition card data structure:
```text
Card 1: Sarah Jenkins → Alex Chen, +50, TEAMWORK
Card 2: Shomari Love → Priya Patel, +100, CULTURE  
Card 3: Elena Rodriguez → David Kim, +75, EXCELLENCE
```

The carousel will use framer-motion `animate` with `y` translation on a loop, showing one card prominently with adjacent cards partially visible and faded (opacity gradient at top/bottom).

