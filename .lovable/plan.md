

# FAQ Section - "Everything you need to know."

## Layout
- White background, two-column layout
- Heading: "Everything you need to know." (large, bold, `#0F0D33`, centered)
- Left column: category tabs (vertical list) — clicking switches which FAQ items show on the right
- Right column: accordion FAQ items with `+`/`×` toggle icons, rounded white cards with subtle border

## Left Column - Category Tabs
Vertical list of 5 categories. Active category has purple/indigo rounded pill background (`#4F46E5`) with white text. Inactive categories are plain text `#0F0D33`.

Categories and their questions:

**Pricing & Value** (default active):
1. "How is the $10 per seat actually calculated?" → "It's simple. $10 per seat per month gives every employee 100 points to recognize their colleagues with. That's $5 of recognition value per person, per month. For a 50 person team, that's $250 of peer appreciation flowing through your company every month that didn't exist before."
2. "Is 100 points per month enough?" → "More than you'd think. 100 points per user means every single person on your team has something meaningful to give every month. When recognition is distributed evenly across the whole company rather than concentrated at the top, the culture impact is significant even at modest point values."
3. "Are there any fees we haven't mentioned?" → "No. No implementation fees, no support fees, no redemption fees, no surprise invoices. The only costs are your base seat cost and whatever celebration budget you choose to set, which is completely optional and fully in your control."
4. "When do I actually get charged?" → "You can sign up and explore Grattia completely free. You won't be charged anything until you start inviting your team members."

**Adoption & Usage**:
1. "How long does it take to see results?" → "Most teams see a noticeable increase in peer recognition within the first two weeks. The monthly points reset creates a natural rhythm that keeps engagement consistent."
2. "What if some team members don't participate?" → "That's completely normal at first. As recognition flows increase and people start receiving points, participation tends to grow organically. The leaderboard and feed features also help drive engagement."

**Integrations & Setup**:
1. "How long does setup take?" → "About 5 minutes. Connect your Slack or Teams workspace, invite your team, and you're ready to go. No IT involvement needed."
2. "Does it work with both Slack and Microsoft Teams?" → "Yes. Grattia integrates natively with both Slack and Microsoft Teams, so your team can send recognition right where they already work."

**Rewards**:
1. "What gift cards are available?" → "We offer a curated catalog of popular brands including Amazon, Starbucks, Nike, Visa, and many more. Team members choose the rewards that matter most to them."
2. "Are there any redemption fees?" → "Never. When your team redeems points for gift cards, 100% of the value goes to them. No markups, no processing fees, no hidden charges."

**Scale**:
1. "Can Grattia handle large teams?" → "Absolutely. Grattia is built to scale from small teams to organizations with hundreds of employees. For teams over 500, contact us for volume pricing."
2. "Can we add or remove team members anytime?" → "Yes. Billing adjusts automatically with prorated charges when you add members, and scales down when you remove them."

## Component Design
- Use React `useState` for active category
- Use Radix Accordion (single mode) for the FAQ items on the right
- Accordion items: white rounded-xl cards with subtle border, `+` icon when closed, `×` when open
- Smooth open/close animation

## Changes

### 1. Create `src/components/FAQSection.tsx`
- Stateful component with category tabs and accordion FAQ items
- Two-column responsive layout

### 2. Update `src/pages/Index.tsx`
- Import and add `<FAQSection />` after `<PricingSection />`

