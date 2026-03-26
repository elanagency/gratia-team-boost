
Fix the sidebar typography by aligning it to the Figma weights instead of just “using Inter”.

What I found
- `Inter` is now imported, so the issue is not the font loading anymore.
- The sidebar still uses `font-medium` in places where the Figma screenshots show lighter text.
- Your latest screenshots indicate:
  - “Give Recognition” button: Inter Medium, 14px, line-height 21
  - Active nav item (“Home”): Inter Medium, 14px, line-height 21
  - Inactive nav items (“Analytics”, “Leaderboard”, etc.): Inter Regular, 14px, line-height 21
- The current sidebar uses `font-medium` on all nav items, which is why everything looks too heavy.

What I would change
1. Update `src/components/dashboard/DashboardSidebar.tsx`
   - Keep the sidebar width at the exact Figma width of `240px`
   - Keep the sidebar root on `Inter`
   - Change nav typography logic:
     - active item: `font-medium text-white`
     - inactive items: `font-normal text-white/70`
   - Keep the button as `font-medium text-[14px] leading-[21px]`
   - Keep company/user secondary text at regular 11px with reduced opacity
   - Remove any lingering heavier weights from labels that should be regular
   - Match the selected row background and spacing more closely to the screenshot

2. Tighten icon/text balance
   - The icons currently read a bit heavier because the text is too bold beside them
   - After reducing inactive nav text to regular weight, the whole menu should visually match Figma much more closely

3. Verify sidebar-only typography map
   - Company name: Inter Medium 13px
   - Teammate count: Inter Regular 11px / 45%
   - Button label: Inter Medium 14px / 21px
   - Active nav label: Inter Medium 14px / 21px
   - Inactive nav label: Inter Regular 14px / 21px
   - Footer name: Inter Medium 13px
   - Footer role: Inter Regular 11px / 45%

Files to update
- `src/components/dashboard/DashboardSidebar.tsx`

Why this should fix it
- The problem is no longer missing fonts; it’s incorrect weight assignment.
- Right now the sidebar is visually heavier than Figma because medium weight is being applied too broadly.
- Reducing inactive menu labels to regular should make the sidebar look much closer to the Figma immediately without changing the structure again.

Technical note
- I would not change the global body font for this fix.
- I would keep this scoped to the sidebar component so we don’t unintentionally affect other dashboard areas.
