

## Update Redeem Points Page to Match Figma

### Figma Specs (from screenshots)

**Page title**: "Redeem Points" — Inter 22px, weight 600, color #0F0533

**Tabs**: Custom underline-style tabs (not the default Radix pill style)
- Tab container: `height: 34.25px`, `border-bottom: 1px solid #E8E6F0`, `gap: 22.5px`
- Active tab: Icon + text, Inter 14px weight 500 color #0F0533, `border-bottom: 2px solid #7F2BFE`, `padding-bottom: 13.25px`
- Inactive tab: Icon + text, Inter 14px weight 500, muted color
- "Gift Cards" tab has a card icon (16x16), "My Redemptions" tab has a clock icon (16x16)

**Search input**: Full width (1040px), `height: 38px`, `border-radius: 13.375px`, `border: 1px solid #E8E6F0`, `background: #F5F5F7`, `padding: 7.5px 15px 7.5px 33.75px`, placeholder "Search gift cards..."

**Gift card grid**: 3 columns (at the Figma viewport), cards with:
- Card container: `flex-direction: column`, `padding: 15px 15px 0 15px` for image area, then info section below
- Image container: `height: 154.219px`, `background: #FFF`, `padding: 0 15px`, centered, `justify-content: center`, `align-items: center`
- Info section: `padding: 15px 15px 0 15px`, `gap: 11.25px`, `flex-direction: column`
- Brand name: Inter, weight 600, color #0F0533
- **Redeem button**: `border-radius: 9.375px`, `background: linear-gradient(135deg, #7F2BFE, #FC5BFF)`, `padding: 8.5px 0 6px 0`, white text "Redeem", Inter font weight 500

### Changes

**1. `src/pages/team/GiftCardShop.tsx`**
- Change page title from using inner component heading to "Redeem Points" at page level (Inter 22px/600/#0F0533)
- Replace default `TabsList`/`TabsTrigger` with custom underline-style tabs matching Figma
- Add icons: card icon for "Gift Cards", clock icon for "My Redemptions"
- Custom tab styling: no bg pill, use border-bottom indicator in purple (#7F2BFE)

**2. `src/components/team/RewardShop.tsx`**
- Remove the `<h2>Gift Cards Shop</h2>` heading and `RealTimeStatus` (title moved to parent)
- Make search input full-width with Figma styling: `rounded-[13.375px]`, `border-[#E8E6F0]`, `bg-[#F5F5F7]`, height 38px

**3. `src/components/team/SimpleGiftCardItem.tsx`**
- Add a gradient "Redeem" button at bottom of each card
- Button: `linear-gradient(135deg, #7F2BFE, #FC5BFF)`, white text, `rounded-[9.375px]`, `padding: 8.5px 6px`
- Image container: white bg, fixed height ~154px, centered
- Info section: padding 15px, gap 11.25px
- Brand name: font-semibold (600), color #0F0533

**4. `src/components/team/SimpleGiftCardGrid.tsx`**
- Change grid to 3 columns at md+ breakpoint to match Figma layout: `grid-cols-1 md:grid-cols-3`

### Files to modify
1. `src/pages/team/GiftCardShop.tsx` — page title + custom tabs
2. `src/components/team/RewardShop.tsx` — remove heading, update search styling
3. `src/components/team/SimpleGiftCardItem.tsx` — add Redeem button, update card layout
4. `src/components/team/SimpleGiftCardGrid.tsx` — adjust grid columns

