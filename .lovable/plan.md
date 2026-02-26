

## Redesign Footer to match Figma

Current footer is a simple centered layout. Figma shows a structured two-row layout.

### Changes to `src/components/Footer.tsx`

**Row 1** (flex, space-between, items-center):
- Left: Grattia logo image
- Center: Navigation links — Features, Pricing, FAQs, Contact (horizontal, text-gray-300, gap-8)
- Right: LinkedIn icon (outlined circle with "in" icon)

**Row 2** (flex, space-between, smaller text, top border or spacing):
- Left: "© 2026 Grattia. All rights reserved." in gray-400
- Right: "Privacy Policy" and "Terms of Service" links in gray-400

Background stays `#0F0533`. Use `lucide-react` Linkedin icon. Link Privacy Policy to `/privacy`, Terms to `/terms`.

