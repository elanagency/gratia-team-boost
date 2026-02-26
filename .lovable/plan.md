

## Make public pages mobile responsive

The main issue is the **Header component** — on mobile (`<md`), the nav links are hidden (`hidden md:flex`) but there's no hamburger menu fallback. The Log In / Sign Up buttons are always visible and may crowd on small screens.

The content pages (Terms, Privacy, ForgotPassword, ResetPassword, NotFound) are already reasonably responsive with `px-4`, `max-w-md`, etc. Minor tweaks needed for text sizing.

### Changes

#### 1. `src/components/Header.tsx` — Add mobile hamburger menu
- Add mobile menu state with `useState`
- Show a hamburger icon (`Menu`/`X` from lucide) on `md:hidden`
- When open, render a dropdown panel below the pill with: Features, Pricing, FAQs links + Log In / Sign Up buttons
- Hide the desktop nav + buttons on mobile, show hamburger instead
- Reduce horizontal padding on mobile: `px-4 md:px-8`

#### 2. `src/pages/Terms.tsx` — Minor mobile text sizing
- Title: `text-2xl sm:text-4xl`
- Section headings: `text-xl sm:text-2xl`

#### 3. `src/pages/Privacy.tsx` — Same text sizing adjustments
- Title: `text-2xl sm:text-4xl`
- Section headings: `text-xl sm:text-2xl`

#### 4. `src/pages/NotFound.tsx` — Responsive text
- 404 heading: `text-4xl sm:text-6xl`
- Add `px-4` to the container

