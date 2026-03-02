

## Fix Section Navigation (Header + Footer)

### Problems Found
1. **No `id="features"` on any section** — Header/Footer link to `#features` but no element has that ID
2. **FAQ ID mismatch** — Section has `id="faq"` but links target `#faqs`
3. **Footer uses plain `<a href>` tags** — These only work on the Index page, not from `/signup` or other pages
4. **Footer links to `#contact`** — No such section exists; should be removed

### Changes

**1. `src/components/TheSolution.tsx`** — Add `id="features"` to the section tag (this is the "Recognition that becomes part of how your team works" section)

**2. `src/components/FAQSection.tsx`** — Change `id="faq"` to `id="faqs"` to match what the Header and Footer link to

**3. `src/components/Footer.tsx`** — Replace `<a href="#...">` links with buttons using the same cross-page `scrollToSection` pattern from Header:
- Import `useLocation` and `useNavigate` from react-router-dom
- Add `scrollToSection` helper (navigate to `/#section` if not on `/`, otherwise scroll directly)
- Remove the "Contact" link (no section exists)
- Convert Features, Pricing, FAQs to `<button onClick>` elements

