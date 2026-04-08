
Goal: fix the Team Members role pills so they match the screenshots exactly.

What I found
- The current pills in `src/components/team/TeamMemberTable.tsx` are still wrong:
  - Member uses a purple-pink gradient with white text
  - Admin uses an orange gradient
- Your screenshots show a different design:
  - Same soft tinted pill background for both roles
  - Member text color: `#7F2BFE`
  - Admin text color: `#FC5BFF`
  - Background: very light pink tint, effectively `#FC5BFF` at about 10% opacity
  - Typography: `11px`, weight `500`, line-height `16.5px`
  - Rounded full pill with the tighter Figma-style padding

Implementation plan
1. Update the role pill styling in `src/components/team/TeamMemberTable.tsx`
   - Remove the current gradient/orange fills
   - Use one shared pill background for both roles: light pink tint
   - Set text color conditionally:
     - Member: `#7F2BFE`
     - Admin: `#FC5BFF`

2. Match the Figma spacing more closely
   - Use the tighter inline pill sizing from the screenshots
   - Apply near-Figma padding values so the badge width/height looks correct for both “Member” and “Admin”
   - Keep the fully rounded pill shape

3. Keep the rest of the table unchanged
   - No layout or pagination changes
   - No button/container changes in this pass
   - Only correct the pill visuals

Files to update
- `src/components/team/TeamMemberTable.tsx`

Technical details
```text
Member pill:
- background: rgba(252, 91, 255, 0.10)
- text: #7F2BFE

Admin pill:
- background: rgba(252, 91, 255, 0.10)
- text: #FC5BFF

Shared:
- font-size: 11px
- font-weight: 500
- line-height: 16.5px
- border-radius: 9999px
- compact horizontal/vertical padding to match screenshot
```
