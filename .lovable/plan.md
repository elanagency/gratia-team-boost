

## Pricing Section Figma Alignment

Based on the Figma screenshots and the user's observations, here are all the changes needed in **`src/components/PricingSection.tsx`**:

### 1. Title weight
- Change `font-bold` to `font-semibold` on the heading to match the lighter weight in the Figma.
- Update font family to Poppins to match other LP headings.

### 2. Left card — Company Size row
- Move the employee count badge to the **right side** of the row (use `justify-between` on the flex container so "Company Size" is left and the pill is right-aligned).
- Update badge styling: background `#F5F3FF`, border `1px solid rgba(127,120,248,0.2)`, text color `#7F78F8` (purple-blue).

### 3. Left card — Celebration Gift Value row
- Move the `$X / event` badge to the **right side** (same `justify-between` pattern). Keep the "Optional" badge next to the label.
- Update badge styling: background `#FDF2F8`, border `1px solid #FCE7F3`, text color `#E60076` (pink).

### 4. Left card — Total section layout
- Change from `text-center` to a **flex row** with `justify-between`:
  - Left side: "Total Monthly Cost" label, `$XX` amount, and "Platform, points, and celebrations." stacked vertically, all **left-aligned**.
  - Right side: "Get Started" button, **right-aligned** and vertically centered.
- Button: reduce border-radius from `rounded-full` to `rounded-xl` (~14px per Figma), keep dark background `#0F0D33`.

### 5. Right side — "Everything included" icon
- Replace the `Sparkles` icon with a calculator/grid icon (`LayoutGrid` or `Calculator` from lucide-react).
- Wrap it in a 40x40px container with `rounded-[10px]`, background `rgba(127,120,248,0.1)`, centered icon in purple.

### 6. "More than 500 employees?" line
- Change to **text-center** alignment.
- Update "Contact us for volume pricing." link color from `#F572FF` (pink) to `#7F78F8` (purple), with `font-semibold` (weight 600).

### Files changed
- `src/components/PricingSection.tsx` — all changes above in a single file.

