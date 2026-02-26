

# Slack Recognition Feed Section

## Layout
- Two-column layout, **flipped** from RecognitionDemo: left = animated card, right = text
- White background (continuing from RecognitionDemo's fade to white)

## Left Column — Slack Channel Mock
- White card with rounded corners and subtle shadow (matching RecognitionDemo card style)
- Purple header bar: "# recognition" with a members icon showing "42"
- List of recognition messages, each with:
  - Avatar (colored circle with initials), **Name** in bold, timestamp in gray
  - "Recognized **@Name** for **#Value**" with names in blue/purple links, values as hashtag links
  - Quoted message in gray italic
  - Reaction emojis: 🔥 and 👏 with counts
- Bottom: "Message #recognition" input placeholder
- **Animation**: Slow continuous vertical scroll through ~6-8 recognition entries, looping seamlessly (marquee-style)
- Fixed height container with overflow hidden so it doesn't cause layout shift

## Right Column — Text + Integration Badges
- Heading: "Celebrations that show up right in Slack and Teams" — Poppins, bold, `#0F0D33`
- Subtitle: "When someone gets recognized in Grattia, it shows up directly in your Slack or Microsoft Teams channels. The whole team can celebrate together, right where conversations already happen."
- Two badge/pill buttons: Slack logo + "Slack", Teams logo + "Microsoft Teams" — white bg, border, rounded

## Recognition entries data (from screenshots):
1. Lucas → @Daniel for #Support — "Thanks for helping me with the onboarding." — 🔥1 👏2
2. James → @Grace for #Excellence — "Customer feedback has been amazing." — 🔥3 👏1
3. Mike → @Jessica for #Innovation — "Love the new design concepts." — 🔥3 👏5
4. David → @Emily for #Leadership — "Thanks for leading the sprint planning." — 🔥4 👏2
5. Emma → @Chris for #Dedication — "Staying late to fix that bug was heroic." — 🔥5 👏3
6. Nour → @Sophie for #Creativity — "The new ad copy is brilliant!" — 🔥2 👏4

## Changes

1. **Create `src/components/SlackFeedSection.tsx`** — New section with two-column layout (left: animated Slack mock, right: text + badges). Uses CSS animation or framer-motion for slow infinite vertical scroll of recognition entries. Uses actual Slack and Teams logo assets already in `src/assets/`.

2. **Update `src/pages/Index.tsx`** — Add `<SlackFeedSection />` after `<RecognitionDemo />`.

