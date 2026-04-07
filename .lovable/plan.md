

## Fix Stats Label Typography

### Problem
The labels ("Points", "Received", "Sent") under the stat numbers are currently `14px`, `font-semibold`, color `#0F0533`. Per the Figma inspect panel, they should be:
- Font: Inter
- Size: **11px**
- Weight: **400** (normal, not semibold)
- Color: **#9996AA**
- Line-height: 16.5px (150%)

### Change in `src/components/dashboard/PersonalStatsCard.tsx`

**Lines 96-100** — Update the label `<span>` styling:
- Remove `className="font-semibold"`
- Change `fontSize` from `"14px"` to `"11px"`
- Change `color` from `"#0F0533"` to `"#9996AA"`
- Add `fontWeight: 400` and `lineHeight: "16.5px"`

### File to modify
1. `src/components/dashboard/PersonalStatsCard.tsx` — label span styling only

