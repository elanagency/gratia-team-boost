

# Nail the #1 Hero Card to Figma Specs

## Figma specs from screenshots

| Property | Current | Figma |
|----------|---------|-------|
| Card height | auto | **160.75px** |
| Card padding | 24.5px all sides | **24.5px 24.5px 2px 24.5px** |
| Card flex-direction | row (alignItems center) | **column, align-items flex-start** -- wait, looking again it's row with the avatar on the left |
| Card border | 2px solid #7F2BFE | 2px solid #7F2BFE (correct) |
| Card border-radius | 15px | 15px (correct) |
| Card background | rgba(127,43,254,0.08) to rgba(252,91,255,0.08) | linear-gradient(135deg, #7F2BFE 8%, #FC5BFF 8%) -- both at 8% opacity |
| Avatar size | 75x75 | **90x90** |
| Rank badge size | 37.5x37.5 | 37.5x37.5 (correct) |
| Rank badge position | bottom:-4, right:-4 | Figma shows it overlapping bottom-right of avatar |
| Rank badge border | 3px solid #fff | Need to verify -- no border visible in Figma box model |
| Rank text | fontSize 16, fontWeight 700, color #fff | fontSize **16px**, fontWeight **600**, color **#FFF**, lineHeight **24px** |
| Rank badge background | linear-gradient(135deg, #7F2BFE, #FC5BFF) | Same (correct) |

## Changes in `src/pages/admin/Leaderboard.tsx`

1. **Card container**: Change `padding` to `"24.5px 24.5px 2px 24.5px"`, add `height: 160.75` and keep `alignItems: "center"` (the vertical centering within the fixed height card)
2. **Avatar**: Change width/height from 75 to **90**, update the relative container to match
3. **Avatar fallback font**: Scale up from 24 to ~28 to fit 90px avatar
4. **Rank badge text**: Change `fontWeight: 700` to **600**, ensure `lineHeight: "24px"`
5. **Rank badge border**: Remove `border: "3px solid #fff"` (not shown in Figma)

### File modified
- `src/pages/admin/Leaderboard.tsx`

